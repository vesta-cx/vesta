import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { sourceFiles, candidateFiles } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

type WebhookSource = {
	id: string;
	filename: string;
	r2Key: string;
	uploadedAt: number;
	duration: number;
};

type WebhookCandidate = {
	id: string;
	r2Key: string;
	codec: string;
	bitrate: number;
	sourceFileId: string;
};

/** Webhook called by euterpe when transcoding completes. Updates source_files (created at submit) with r2_key/basename/duration, inserts candidates. */
export const POST: RequestHandler = async ({ request, platform }) => {
	if (!platform) return json({ error: 'Platform not available' }, { status: 500 });

	try {
		const body = (await request.json()) as {
			jobId?: string;
			status?: string;
			sourceFileId?: string | null;
			candidateIds?: string[];
			error?: string | null;
			source?: WebhookSource | null;
			candidates?: WebhookCandidate[];
		};

		if (!body?.jobId) return json({ error: 'Missing jobId' }, { status: 400 });
		if (body.status !== 'complete' || !body.source || !body.candidates) {
			return json({ received: true });
		}

		const source = body.source;
		const candidates = body.candidates;
		const db = getDb(platform);

		const [existing] = await db
			.select({ id: sourceFiles.id })
			.from(sourceFiles)
			.where(eq(sourceFiles.id, source.id));

		if (!existing) {
			return json(
				{ error: `Source file ${source.id} not found (submitted before this deployment?)` },
				{ status: 400 }
			);
		}

		await db
			.update(sourceFiles)
			.set({
				r2Key: source.r2Key,
				basename: source.filename,
				duration: source.duration
			})
			.where(eq(sourceFiles.id, source.id));

		for (const c of candidates) {
			await db.insert(candidateFiles).values({
				id: c.id,
				r2Key: c.r2Key,
				codec: c.codec as 'flac' | 'opus' | 'mp3' | 'aac',
				bitrate: c.bitrate,
				sourceFileId: c.sourceFileId
			});
		}

		return json({ received: true, persisted: true });
	} catch (err) {
		console.error('euterpe-complete webhook:', err);
		return json({ error: 'Failed to persist' }, { status: 500 });
	}
};
