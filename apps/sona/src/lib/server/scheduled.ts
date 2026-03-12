/**
 * Cloudflare Cron Trigger handler.
 * This is called by the scheduled() event in the worker entry point.
 *
 * With SvelteKit + adapter-cloudflare, you need to add the scheduled handler
 * to `wrangler.jsonc` or create a custom worker entry that delegates to both
 * SvelteKit's fetch handler and this scheduled handler.
 *
 * For now, this module exports the handler logic. It can be wired up
 * via the app's `/api/cron` endpoint as a workaround, or via a custom
 * _worker.js entry point.
 */

import { drizzle } from 'drizzle-orm/d1';
import * as schema from './db/schema';
import { generateSnapshot } from './snapshots';

export const handleScheduled = async (env: {
	DB: D1Database;
	AUDIO_BUCKET: R2Bucket;
}): Promise<void> => {
	const db = drizzle(env.DB, { schema });
	await generateSnapshot(db);
};
