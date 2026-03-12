import { fail } from '@sveltejs/kit';
import { eq, inArray } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import {
	answers,
	listeningDevices,
	DEVICE_TYPES,
	CONNECTION_TYPES,
	PRICE_TIERS
} from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	if (!platform) {
		return {
			devices: [],
			deviceTypes: DEVICE_TYPES,
			connectionTypes: CONNECTION_TYPES,
			priceTiers: PRICE_TIERS
		};
	}

	const db = getDb(platform);
	const devices = await db.select().from(listeningDevices).all();

	return {
		devices,
		deviceTypes: DEVICE_TYPES,
		connectionTypes: CONNECTION_TYPES,
		priceTiers: PRICE_TIERS
	};
};

export const actions = {
	create: async ({ request, platform }) => {
		if (!platform) return fail(500, { error: 'Platform not available' });

		const data = await request.formData();
		const deviceType = data.get('device_type') as string;
		const connectionType = data.get('connection_type') as string;
		const brand = data.get('brand') as string;
		const model = data.get('model') as string;
		const priceTier = data.get('price_tier') as string;

		if (!deviceType || !connectionType || !brand?.trim() || !model?.trim() || !priceTier) {
			return fail(400, { error: 'All fields are required' });
		}
		if (!DEVICE_TYPES.includes(deviceType as (typeof DEVICE_TYPES)[number])) {
			return fail(400, { error: 'Invalid device type' });
		}
		if (!CONNECTION_TYPES.includes(connectionType as (typeof CONNECTION_TYPES)[number])) {
			return fail(400, { error: 'Invalid connection type' });
		}
		if (!PRICE_TIERS.includes(priceTier as (typeof PRICE_TIERS)[number])) {
			return fail(400, { error: 'Invalid price tier' });
		}

		const db = getDb(platform);
		await db.insert(listeningDevices).values({
			deviceType: deviceType as (typeof DEVICE_TYPES)[number],
			connectionType: connectionType as (typeof CONNECTION_TYPES)[number],
			brand: brand.trim(),
			model: model.trim(),
			priceTier: priceTier as (typeof PRICE_TIERS)[number]
			// approvedAt left null — admin-added devices stay pending to prevent oopsies
		});

		return { success: true };
	},
	approve: async ({ request, platform }) => {
		if (!platform) return fail(500, { error: 'Platform not available' });

		const data = await request.formData();
		const id = data.get('id') as string;
		if (!id) return fail(400, { error: 'Missing device ID' });

		const db = getDb(platform);
		await db
			.update(listeningDevices)
			.set({ approvedAt: new Date(), approvedBy: 'admin' })
			.where(eq(listeningDevices.id, id));

		return { success: true };
	},
	approveBulk: async ({ request, platform }) => {
		if (!platform) return fail(500, { error: 'Platform not available' });

		const data = await request.formData();
		const ids = data.getAll('ids') as string[];
		if (!ids.length) return fail(400, { error: 'No devices selected' });

		const db = getDb(platform);
		for (const id of ids) {
			await db
				.update(listeningDevices)
				.set({ approvedAt: new Date(), approvedBy: 'admin' })
				.where(eq(listeningDevices.id, id));
		}

		return { success: true, approved: ids.length };
	},
	update: async ({ request, platform }) => {
		if (!platform) return fail(500, { error: 'Platform not available' });

		const data = await request.formData();
		const id = data.get('id') as string;
		const deviceType = data.get('device_type') as string;
		const connectionType = data.get('connection_type') as string;
		const brand = data.get('brand') as string;
		const model = data.get('model') as string;
		const priceTier = data.get('price_tier') as string;

		if (!id) return fail(400, { error: 'Missing device ID' });
		if (!deviceType || !connectionType || !brand?.trim() || !model?.trim() || !priceTier) {
			return fail(400, { error: 'All fields are required' });
		}
		if (!DEVICE_TYPES.includes(deviceType as (typeof DEVICE_TYPES)[number])) {
			return fail(400, { error: 'Invalid device type' });
		}
		if (!CONNECTION_TYPES.includes(connectionType as (typeof CONNECTION_TYPES)[number])) {
			return fail(400, { error: 'Invalid connection type' });
		}
		if (!PRICE_TIERS.includes(priceTier as (typeof PRICE_TIERS)[number])) {
			return fail(400, { error: 'Invalid price tier' });
		}

		const db = getDb(platform);
		await db
			.update(listeningDevices)
			.set({
				deviceType: deviceType as (typeof DEVICE_TYPES)[number],
				connectionType: connectionType as (typeof CONNECTION_TYPES)[number],
				brand: brand.trim(),
				model: model.trim(),
				priceTier: priceTier as (typeof PRICE_TIERS)[number]
			})
			.where(eq(listeningDevices.id, id));

		return { success: true };
	},
	reject: async ({ request, platform }) => {
		if (!platform) return fail(500, { error: 'Platform not available' });

		const data = await request.formData();
		const id = data.get('id') as string;
		if (!id) return fail(400, { error: 'Missing device ID' });

		const db = getDb(platform);
		await db
			.update(listeningDevices)
			.set({ approvedAt: null, approvedBy: null })
			.where(eq(listeningDevices.id, id));

		return { success: true };
	},
	remove: async ({ request, platform }) => {
		if (!platform) return fail(500, { error: 'Platform not available' });

		const data = await request.formData();
		const id = data.get('id') as string;
		if (!id) return fail(400, { error: 'Missing device ID' });

		const db = getDb(platform);
		const used = await db
			.select({ id: answers.id })
			.from(answers)
			.where(eq(answers.deviceId, id))
			.limit(1);

		if (used.length > 0) {
			return fail(400, { error: 'Cannot remove device: it has been used in survey responses.' });
		}

		await db.delete(listeningDevices).where(eq(listeningDevices.id, id));
		return { success: true, removed: true };
	},
	removeBulk: async ({ request, platform }) => {
		if (!platform) return fail(500, { error: 'Platform not available' });

		const data = await request.formData();
		const ids = data.getAll('ids') as string[];
		if (!ids.length) return fail(400, { error: 'No devices selected' });

		const db = getDb(platform);
		const used = await db
			.select({ deviceId: answers.deviceId })
			.from(answers)
			.where(inArray(answers.deviceId, ids));

		const usedIds = new Set(used.map((u) => u.deviceId));
		const toRemove = ids.filter((id) => !usedIds.has(id));
		const skipped = ids.length - toRemove.length;

		for (const id of toRemove) {
			await db.delete(listeningDevices).where(eq(listeningDevices.id, id));
		}

		return {
			success: true,
			removed: toRemove.length,
			skipped: skipped > 0 ? skipped : undefined
		};
	}
} satisfies Actions;
