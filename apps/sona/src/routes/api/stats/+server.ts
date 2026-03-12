import { json } from '@sveltejs/kit';
import { desc } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { resultSnapshots } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform }) => {
	if (!platform) {
		return json({ snapshot: null });
	}

	try {
		const db = getDb(platform);

		const snapshot = await db
			.select()
			.from(resultSnapshots)
			.orderBy(desc(resultSnapshots.createdAt))
			.limit(1)
			.get();

		return json({
			snapshot: snapshot
				? {
						createdAt: snapshot.createdAt,
						totalResponses: snapshot.totalResponses,
						insights: snapshot.insights
					}
				: null
		});
	} catch {
		return json({ snapshot: null });
	}
};
