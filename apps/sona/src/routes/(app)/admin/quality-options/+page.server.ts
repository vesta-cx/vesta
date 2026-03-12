import { fail } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { qualityOptions, CODECS } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	if (!platform) return { options: [] };

	const db = getDb(platform);
	const options = await db.select().from(qualityOptions).all();

	return { options, codecs: CODECS };
};

export const actions = {
	toggle: async ({ request, platform }) => {
		if (!platform) return fail(500, { error: 'Platform not available' });

		const data = await request.formData();
		const codec = data.get('codec') as string;
		const bitrate = parseInt(data.get('bitrate') as string, 10);
		const enabled = data.get('enabled') === 'true';

		if (!codec || isNaN(bitrate)) {
			return fail(400, { error: 'Invalid codec or bitrate' });
		}

		const db = getDb(platform);
		await db
			.update(qualityOptions)
			.set({ enabled: !enabled })
			.where(
				and(
					eq(qualityOptions.codec, codec as (typeof CODECS)[number]),
					eq(qualityOptions.bitrate, bitrate)
				)
			);

		return { success: true };
	},

	seed: async ({ platform }) => {
		if (!platform) return fail(500, { error: 'Platform not available' });

		const db = getDb(platform);
		const bitrates = [320, 256, 192, 160, 128, 96, 64, 48, 32];

		const values = [
			// FLAC lossless
			{ codec: 'flac' as const, bitrate: 0, enabled: true },
			// Lossy codecs at all bitrates
			...bitrates.flatMap((br) =>
				(['opus', 'mp3', 'aac'] as const).map((codec) => ({
					codec,
					bitrate: br,
					enabled: true
				}))
			)
		];

		// Insert ignore duplicates (SQLite ON CONFLICT DO NOTHING)
		for (const v of values) {
			try {
				await db.insert(qualityOptions).values(v);
			} catch {
				// Already exists, skip
			}
		}

		return { success: true, message: `Seeded ${values.length} quality options` };
	}
} satisfies Actions;
