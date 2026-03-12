import { fail } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { getStorage } from '$lib/server/storage';
import {
	listeningDevices,
	sourceFiles,
	qualityOptions,
	candidateFiles,
	ephemeralStreamUrls,
	answers,
	resultSnapshots,
	surveyConfig
} from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

/** Clearable tables in FK-safe order. Sources/candidates also delete R2 objects. */
const CLEARABLE_TABLES = [
	{ key: 'ephemeral_stream_urls', label: 'Ephemeral stream URLs' },
	{ key: 'answers', label: 'Answers' },
	{ key: 'candidate_files', label: 'Candidate files (+ R2)' },
	{ key: 'source_files', label: 'Source files (+ R2)' },
	{ key: 'result_snapshots', label: 'Result snapshots' },
	{ key: 'survey_config', label: 'Survey config' },
	{ key: 'quality_options', label: 'Quality options' },
	{ key: 'listening_devices', label: 'Listening devices' }
] as const;

const MAX_ROWS = 500;

type TableData = {
	name: string;
	rows: Record<string, unknown>[];
	total: number;
	truncated: boolean;
};

export const load: PageServerLoad = async ({ platform }) => {
	if (!platform) {
		return { tables: [], clearableTables: CLEARABLE_TABLES };
	}

	const db = getDb(platform);

	const fetchTable = async (
		name: string,
		query: ReturnType<typeof db.select>
	): Promise<TableData> => {
		const all = await query.all();
		const total = all.length;
		const truncated = total > MAX_ROWS;
		const rows = (truncated ? all.slice(0, MAX_ROWS) : all).map((r) => {
			const obj: Record<string, unknown> = {};
			for (const [k, v] of Object.entries(r)) {
				obj[k] = v instanceof Date ? v.toISOString() : v;
			}
			return obj;
		});
		return { name, rows, total, truncated };
	};

	const tables = await Promise.all([
		fetchTable('listening_devices', db.select().from(listeningDevices)),
		fetchTable('source_files', db.select().from(sourceFiles)),
		fetchTable('quality_options', db.select().from(qualityOptions)),
		fetchTable('candidate_files', db.select().from(candidateFiles)),
		fetchTable(
			'ephemeral_stream_urls',
			db.select().from(ephemeralStreamUrls).orderBy(desc(ephemeralStreamUrls.expiresAt))
		),
		fetchTable('answers', db.select().from(answers).orderBy(desc(answers.createdAt))),
		fetchTable(
			'result_snapshots',
			db.select().from(resultSnapshots).orderBy(desc(resultSnapshots.createdAt))
		),
		fetchTable('survey_config', db.select().from(surveyConfig))
	]);

	return { tables, clearableTables: CLEARABLE_TABLES };
};

export const actions = {
	/** Clear selected tables. Respects FK order; sources/candidates also delete R2. */
	clearData: async ({ request, platform }) => {
		if (!platform) return fail(500, { error: 'Platform not available' });

		const formData = await request.formData();
		const selected = new Set(formData.getAll('clear') as string[]);
		if (selected.size === 0) {
			return fail(400, { error: 'Select at least one table to clear' });
		}

		// Auto-include dependencies: source_files requires candidate_files + ephemeral; listening_devices requires answers
		if (selected.has('source_files')) {
			selected.add('candidate_files');
			selected.add('ephemeral_stream_urls');
		}
		if (selected.has('candidate_files')) selected.add('ephemeral_stream_urls');
		if (selected.has('listening_devices')) selected.add('answers');

		const db = getDb(platform);
		const storage = getStorage(platform);
		const cleared: string[] = [];

		if (selected.has('ephemeral_stream_urls')) {
			await db.delete(ephemeralStreamUrls);
			cleared.push('ephemeral_stream_urls');
		}
		if (selected.has('answers')) {
			await db.delete(answers);
			cleared.push('answers');
		}
		if (selected.has('candidate_files')) {
			const candidates = await db
				.select({ id: candidateFiles.id, r2Key: candidateFiles.r2Key })
				.from(candidateFiles)
				.all();
			for (const c of candidates) {
				try {
					await storage.delete(c.r2Key);
				} catch {
					/* ignore */
				}
			}
			await db.delete(candidateFiles);
			cleared.push('candidate_files');
		}
		if (selected.has('source_files')) {
			const sources = await db
				.select({ id: sourceFiles.id, r2Key: sourceFiles.r2Key })
				.from(sourceFiles)
				.all();
			for (const s of sources) {
				if (s.r2Key) {
					try {
						await storage.delete(s.r2Key);
					} catch {
						/* ignore */
					}
				}
			}
			await db.delete(sourceFiles);
			cleared.push('source_files');
		}
		if (selected.has('result_snapshots')) {
			await db.delete(resultSnapshots);
			cleared.push('result_snapshots');
		}
		if (selected.has('survey_config')) {
			await db.delete(surveyConfig);
			cleared.push('survey_config');
		}
		if (selected.has('quality_options')) {
			await db.delete(qualityOptions);
			cleared.push('quality_options');
		}
		if (selected.has('listening_devices')) {
			await db.delete(listeningDevices);
			cleared.push('listening_devices');
		}

		return { success: true, message: `Cleared: ${cleared.join(', ')}.` };
	}
} satisfies Actions;
