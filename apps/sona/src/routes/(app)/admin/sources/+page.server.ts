import { fail } from '@sveltejs/kit';
import { and, eq, inArray, isNotNull } from 'drizzle-orm';
import { formatList, parseList } from '$lib/utils/list';
import { getDb } from '$lib/server/db';
import { getStorage } from '$lib/server/storage';
import { sourceFiles, candidateFiles, ephemeralStreamUrls, answers } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

const LOSSLESS_EXTS = new Set(['.flac', '.wav', '.aiff', '.alac', '.aif']);

function isLossless(name: string): boolean {
	const lower = name.toLowerCase();
	return [...LOSSLESS_EXTS].some((ext) => lower.endsWith(ext));
}

export const load: PageServerLoad = async ({ platform }) => {
	if (!platform) return { sources: [], candidatesBySource: {} };

	const db = getDb(platform);
	const sources = await db.select().from(sourceFiles).all();
	const allCandidates = await db
		.select({
			sourceFileId: candidateFiles.sourceFileId,
			codec: candidateFiles.codec,
			bitrate: candidateFiles.bitrate
		})
		.from(candidateFiles)
		.all();

	const candidatesBySource: Record<string, { codec: string; bitrate: number }[]> = {};
	for (const c of allCandidates) {
		const list = candidatesBySource[c.sourceFileId] ?? [];
		list.push({ codec: c.codec, bitrate: c.bitrate });
		candidatesBySource[c.sourceFileId] = list;
	}

	return { sources, candidatesBySource };
};

export const actions = {
	uploadRawFlac: async ({ request, platform }) => {
		if (!platform) return fail(500, { error: 'Platform not available' });
		const euterpeUrl = platform.env.EUTERPE_URL;
		const apiKey = platform.env.PRIVATE_EUTERPE_API_KEY;
		const r2AccountId = platform.env.PRIVATE_R2_ACCOUNT_ID;
		const r2AccessKeyId = platform.env.PRIVATE_R2_ACCESS_KEY_ID;
		const r2SecretAccessKey = platform.env.PRIVATE_R2_SECRET_ACCESS_KEY;
		const r2Bucket = platform.env.PRIVATE_R2_BUCKET ?? 'vesta-sona-audio';
		if (!euterpeUrl || !apiKey) {
			return fail(503, {
				error: 'Euterpe not configured (EUTERPE_URL, PRIVATE_EUTERPE_API_KEY)'
			});
		}
		if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey) {
			return fail(503, {
				error:
					'R2 S3 API not configured (PRIVATE_R2_ACCOUNT_ID, PRIVATE_R2_ACCESS_KEY_ID, PRIVATE_R2_SECRET_ACCESS_KEY)'
			});
		}

		const data = await request.formData();
		const file = data.get('file');
		if (!file || !(file instanceof File)) return fail(400, { error: 'Missing file' });
		if (!isLossless(file.name)) {
			return fail(400, { error: 'Only lossless formats accepted (FLAC, WAV, AIFF, ALAC)' });
		}

		const title = (data.get('title') as string)?.trim() ?? '';
		const artist = (data.get('artist') as string)?.trim() ?? '';
		const featuredArtistsRaw = (data.get('featured_artists') as string)?.trim() ?? '';
		const remixArtistsRaw = (data.get('remix_artists') as string)?.trim() ?? '';
		const licenseUrl = (data.get('license_url') as string)?.trim() ?? '';
		const genre = (data.get('genre') as string)?.trim() ?? '';
		const streamUrl = (data.get('stream_url') as string)?.trim() ?? '';

		if (!title || !licenseUrl) return fail(400, { error: 'Title and license URL required' });

		const baseUrl = new URL(request.url).origin;
		const webhookUrl = `${baseUrl}/api/webhooks/euterpe-complete`;

		const filename =
			title
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '_')
				.replace(/^_|_$/g, '') || 'audio';

		const sourceFileId = crypto.randomUUID();
		const db = getDb(platform);

		await db.insert(sourceFiles).values({
			id: sourceFileId,
			title,
			artist: artist ? formatList(parseList(artist)) : null,
			featuredArtists: featuredArtistsRaw ? formatList(parseList(featuredArtistsRaw)) : null,
			remixArtists: remixArtistsRaw ? formatList(parseList(remixArtistsRaw)) : null,
			licenseUrl,
			genre: genre || null,
			streamUrl: streamUrl || null
			// r2Key, basename, duration: null until webhook
		});

		const config = JSON.stringify({
			targets: [
				{ codec: 'flac', bitrate: 0 },
				{ codec: 'opus', bitrate: 128 },
				{ codec: 'opus', bitrate: 96 }
			],
			filename,
			uploadPrefix: '',
			webhookUrl,
			sourceFileId,
			storage: {
				type: 'r2',
				accountId: r2AccountId,
				bucket: r2Bucket,
				accessKeyId: r2AccessKeyId,
				secretAccessKey: r2SecretAccessKey
			}
		});

		const form = new FormData();
		form.append('file', file);
		form.append('config', config);

		const res = await fetch(`${euterpeUrl.replace(/\/$/, '')}/transcode`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${apiKey}` },
			body: form
		});

		if (!res.ok) {
			// Rollback: delete the source_files row we created
			await db.delete(sourceFiles).where(eq(sourceFiles.id, sourceFileId));
			const err = await res.text();
			return fail(res.status === 401 ? 401 : 502, {
				error: err || `Euterpe error: ${res.status}`
			});
		}

		const body = (await res.json()) as { jobId?: string };
		if (!body?.jobId) {
			await db.delete(sourceFiles).where(eq(sourceFiles.id, sourceFileId));
			return fail(502, { error: 'No jobId from euterpe' });
		}

		return { type: 'uploadRawFlac' as const, jobId: body.jobId };
	},

	approve: async ({ request, platform }) => {
		if (!platform) return fail(500, { error: 'Platform not available' });

		const data = await request.formData();
		const id = data.get('id') as string;
		if (!id) return fail(400, { error: 'Missing source ID' });

		const db = getDb(platform);
		const [source] = await db.select().from(sourceFiles).where(eq(sourceFiles.id, id));
		if (!source) return fail(404, { error: 'Source not found' });
		if (!source.r2Key || source.duration == null) {
			return fail(400, { error: 'Cannot approve: transcoding not complete yet' });
		}

		await db
			.update(sourceFiles)
			.set({ approvedAt: new Date(), approvedBy: 'admin' })
			.where(eq(sourceFiles.id, id));

		return { success: true };
	},

	reject: async ({ request, platform }) => {
		if (!platform) return fail(500, { error: 'Platform not available' });

		const data = await request.formData();
		const id = data.get('id') as string;
		if (!id) return fail(400, { error: 'Missing source ID' });

		const db = getDb(platform);
		await db
			.update(sourceFiles)
			.set({ approvedAt: null, approvedBy: null })
			.where(eq(sourceFiles.id, id));

		return { success: true };
	},

	updateStreamUrl: async ({ request, platform }) => {
		if (!platform) return fail(500, { error: 'Platform not available' });

		const data = await request.formData();
		const id = data.get('id') as string;
		const streamUrl = (data.get('stream_url') as string)?.trim() ?? '';
		if (!id) return fail(400, { error: 'Missing source ID' });

		const db = getDb(platform);
		await db
			.update(sourceFiles)
			.set({ streamUrl: streamUrl || null })
			.where(eq(sourceFiles.id, id));

		return { success: true };
	},

	updateMetadata: async ({ request, platform }) => {
		if (!platform) return fail(500, { error: 'Platform not available' });

		const data = await request.formData();
		const id = data.get('id') as string;
		if (!id) return fail(400, { error: 'Missing source ID' });

		const title = (data.get('title') as string)?.trim();
		if (!title) return fail(400, { error: 'Title is required' });

		const licenseUrl = (data.get('license_url') as string)?.trim();
		if (!licenseUrl) return fail(400, { error: 'License URL is required' });

		const durationRaw = data.get('duration') as string;
		const duration = durationRaw ? parseInt(durationRaw, 10) : undefined;
		if (duration !== undefined && (Number.isNaN(duration) || duration < 0)) {
			return fail(400, { error: 'Invalid duration' });
		}

		const db = getDb(platform);
		const artistRaw = (data.get('artist') as string)?.trim() ?? '';
		const featuredArtistsRaw = (data.get('featured_artists') as string)?.trim() ?? '';
		const remixArtistsRaw = (data.get('remix_artists') as string)?.trim() ?? '';
		const genreRaw = (data.get('genre') as string)?.trim() ?? '';
		const updates: Record<string, unknown> = {
			title,
			licenseUrl,
			artist: artistRaw ? formatList(parseList(artistRaw)) : null,
			featuredArtists: featuredArtistsRaw ? formatList(parseList(featuredArtistsRaw)) : null,
			remixArtists: remixArtistsRaw ? formatList(parseList(remixArtistsRaw)) : null,
			genre: genreRaw ? formatList(parseList(genreRaw)) : null,
			streamUrl: (data.get('stream_url') as string)?.trim() || null
		};
		if (duration !== undefined) updates.duration = duration;

		await db.update(sourceFiles).set(updates).where(eq(sourceFiles.id, id));

		return { success: true };
	},

	approveBulk: async ({ request, platform }) => {
		if (!platform) return fail(500, { error: 'Platform not available' });

		const data = await request.formData();
		const ids = data.getAll('ids') as string[];
		if (!ids.length) return fail(400, { error: 'No sources selected' });

		const db = getDb(platform);
		const updated = await db
			.update(sourceFiles)
			.set({ approvedAt: new Date(), approvedBy: 'admin' })
			.where(
				and(
					inArray(sourceFiles.id, ids),
					isNotNull(sourceFiles.r2Key),
					isNotNull(sourceFiles.duration)
				)
			)
			.returning({ id: sourceFiles.id });

		return { success: true, approved: updated.length };
	},

	remove: async ({ request, platform }) => {
		if (!platform) return fail(500, { error: 'Platform not available' });

		const data = await request.formData();
		const id = data.get('id') as string;
		if (!id) return fail(400, { error: 'Missing source ID' });

		const db = getDb(platform);
		const storage = getStorage(platform);

		const candidates = await db
			.select({ id: candidateFiles.id, r2Key: candidateFiles.r2Key })
			.from(candidateFiles)
			.where(eq(candidateFiles.sourceFileId, id));

		const candidateIds = candidates.map((c) => c.id);

		if (candidateIds.length > 0) {
			const usedA = await db
				.select({ id: answers.id })
				.from(answers)
				.where(inArray(answers.candidateAId, candidateIds))
				.limit(1);
			const usedB = await db
				.select({ id: answers.id })
				.from(answers)
				.where(inArray(answers.candidateBId, candidateIds))
				.limit(1);

			if (usedA.length > 0 || usedB.length > 0) {
				return fail(400, {
					error: 'Cannot remove source: it has been used in survey responses.'
				});
			}
		}

		const [source] = await db.select().from(sourceFiles).where(eq(sourceFiles.id, id));
		if (!source) return fail(404, { error: 'Source not found' });

		if (candidateIds.length > 0) {
			await db
				.delete(ephemeralStreamUrls)
				.where(inArray(ephemeralStreamUrls.candidateFileId, candidateIds));
			for (const c of candidates) {
				try {
					await storage.delete(c.r2Key);
				} catch {
					// Ignore R2 delete errors (key may not exist)
				}
			}
			await db.delete(candidateFiles).where(eq(candidateFiles.sourceFileId, id));
		}

		if (source.r2Key) {
			try {
				await storage.delete(source.r2Key);
			} catch {
				// Ignore R2 delete errors
			}
		}
		await db.delete(sourceFiles).where(eq(sourceFiles.id, id));

		return { success: true, removed: true };
	},

	removeBulk: async ({ request, platform }) => {
		if (!platform) return fail(500, { error: 'Platform not available' });

		const data = await request.formData();
		const ids = data.getAll('ids') as string[];
		if (!ids.length) return fail(400, { error: 'No sources selected' });

		const db = getDb(platform);
		const storage = getStorage(platform);
		let removed = 0;
		const errors: string[] = [];

		for (const id of ids) {
			const candidates = await db
				.select({ id: candidateFiles.id, r2Key: candidateFiles.r2Key })
				.from(candidateFiles)
				.where(eq(candidateFiles.sourceFileId, id));

			const candidateIds = candidates.map((c) => c.id);

			if (candidateIds.length > 0) {
				const [usedA] = await db
					.select({ id: answers.id })
					.from(answers)
					.where(inArray(answers.candidateAId, candidateIds))
					.limit(1);
				const [usedB] = await db
					.select({ id: answers.id })
					.from(answers)
					.where(inArray(answers.candidateBId, candidateIds))
					.limit(1);

				if (usedA || usedB) {
					errors.push(id);
					continue;
				}
			}

			const [source] = await db.select().from(sourceFiles).where(eq(sourceFiles.id, id));
			if (!source) continue;

			if (candidateIds.length > 0) {
				await db
					.delete(ephemeralStreamUrls)
					.where(inArray(ephemeralStreamUrls.candidateFileId, candidateIds));
				for (const c of candidates) {
					try {
						await storage.delete(c.r2Key);
					} catch {
						// ignore
					}
				}
				await db.delete(candidateFiles).where(eq(candidateFiles.sourceFileId, id));
			}

			if (source.r2Key) {
				try {
					await storage.delete(source.r2Key);
				} catch {
					// ignore
				}
			}
			await db.delete(sourceFiles).where(eq(sourceFiles.id, id));
			removed++;
		}

		if (removed === 0 && errors.length > 0) {
			return fail(400, {
				error: 'Cannot remove selected sources: they have been used in survey responses.'
			});
		}

		return { success: true, removed, partial: errors.length > 0 };
	}
} satisfies Actions;
