import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { easterEggMessages } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	if (!platform) return { messages: [] };

	const db = getDb(platform);
	const messages = await db
		.select({ id: easterEggMessages.id, message: easterEggMessages.message })
		.from(easterEggMessages)
		.all();

	return { messages };
};

export const actions = {
	create: async ({ request, platform }) => {
		if (!platform) return fail(500, { error: 'Platform not available' });

		const data = await request.formData();
		const message = (data.get('message') as string)?.trim();
		if (!message) return fail(400, { error: 'Message is required' });

		const db = getDb(platform);
		await db.insert(easterEggMessages).values({ message });

		return { success: true };
	},

	update: async ({ request, platform }) => {
		if (!platform) return fail(500, { error: 'Platform not available' });

		const data = await request.formData();
		const id = data.get('id') as string;
		const message = (data.get('message') as string)?.trim();
		if (!id || !message) return fail(400, { error: 'ID and message are required' });

		const db = getDb(platform);
		await db.update(easterEggMessages).set({ message }).where(eq(easterEggMessages.id, id));

		return { success: true };
	},

	delete: async ({ request, platform }) => {
		if (!platform) return fail(500, { error: 'Platform not available' });

		const data = await request.formData();
		const id = data.get('id') as string;
		if (!id) return fail(400, { error: 'Missing ID' });

		const db = getDb(platform);
		await db.delete(easterEggMessages).where(eq(easterEggMessages.id, id));

		return { success: true };
	},

	seed: async ({ platform }) => {
		if (!platform) return fail(500, { error: 'Platform not available' });

		const db = getDb(platform);
		const existing = await db
			.select({ message: easterEggMessages.message })
			.from(easterEggMessages)
			.all();
		const existingSet = new Set(existing.map((r) => r.message));

		const seedMessages = [
			'good data... yum',
			'your ears are doing great today',
			'we appreciate you',
			"this data is *chef's kiss*",
			'quality input from a quality human'
		];

		const toAdd = seedMessages.filter((m) => !existingSet.has(m));
		for (const msg of toAdd) {
			await db.insert(easterEggMessages).values({ message: msg });
		}

		return {
			success: true,
			message:
				toAdd.length > 0
					? `Added ${toAdd.length} easter egg messages`
					: 'All seed messages already present'
		};
	}
} satisfies Actions;
