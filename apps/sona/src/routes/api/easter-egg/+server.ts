import { json } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { easterEggMessages } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform }) => {
	if (!platform) {
		return json({ message: null });
	}

	try {
		const db = getDb(platform);
		const row = await db
			.select({ message: easterEggMessages.message })
			.from(easterEggMessages)
			.orderBy(sql`random()`)
			.limit(1)
			.get();

		return json({ message: row?.message ?? null });
	} catch {
		return json({ message: null });
	}
};
