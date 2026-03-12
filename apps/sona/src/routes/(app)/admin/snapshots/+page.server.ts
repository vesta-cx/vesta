import { fail } from '@sveltejs/kit';
import { desc } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { resultSnapshots } from '$lib/server/db/schema';
import { generateSnapshot } from '$lib/server/snapshots';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	if (!platform) return { snapshots: [] };

	const db = getDb(platform);
	const snapshots = await db
		.select()
		.from(resultSnapshots)
		.orderBy(desc(resultSnapshots.createdAt))
		.limit(50)
		.all();

	return { snapshots };
};

export const actions = {
	trigger: async ({ platform }) => {
		if (!platform) return fail(500, { error: 'Platform not available' });

		const db = getDb(platform);
		await generateSnapshot(db);

		return { success: true };
	}
} satisfies Actions;
