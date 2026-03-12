import { fail, redirect } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import {
	listeningDevices,
	DEVICE_TYPES,
	CONNECTION_TYPES,
	PRICE_TIERS
} from '$lib/server/db/schema';
import { and, eq, isNotNull, sql } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

/** Normalize brand/model for dedup comparison. */
function normalize(s: string): string {
	return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function formatDeviceSubtitle(device: {
	deviceType: string;
	connectionType: string;
	priceTier: string;
}): string {
	const type = device.deviceType === 'speaker' ? 'Speaker(s)' : 'Headphones';
	const conn = device.connectionType.charAt(0).toUpperCase() + device.connectionType.slice(1);
	const tier = device.priceTier.charAt(0).toUpperCase() + device.priceTier.slice(1);
	return `${type} · ${conn} · ${tier}`;
}

export const load: PageServerLoad = async ({ cookies, platform, url }) => {
	const deviceId = cookies.get('device_id');
	const forceChange = url.searchParams.get('change') === '1';

	let existingDevice: {
		id: string;
		deviceType: string;
		connectionType: string;
		brand: string;
		model: string;
		priceTier: string;
		subtitle: string;
	} | null = null;

	if (deviceId && platform && !forceChange) {
		const db = getDb(platform);
		// Exact ID match: show details even for unapproved (user already has this device)
		const device = await db
			.select({
				id: listeningDevices.id,
				deviceType: listeningDevices.deviceType,
				connectionType: listeningDevices.connectionType,
				brand: listeningDevices.brand,
				model: listeningDevices.model,
				priceTier: listeningDevices.priceTier
			})
			.from(listeningDevices)
			.where(eq(listeningDevices.id, deviceId))
			.get();
		if (device) {
			existingDevice = {
				...device,
				subtitle: formatDeviceSubtitle(device)
			};
		}
	}

	// Full approved devices for autocomplete and unique-device resolution
	const approvedDevices = platform
		? await getDb(platform)
				.select({
					id: listeningDevices.id,
					deviceType: listeningDevices.deviceType,
					connectionType: listeningDevices.connectionType,
					brand: listeningDevices.brand,
					model: listeningDevices.model,
					priceTier: listeningDevices.priceTier
				})
				.from(listeningDevices)
				.where(isNotNull(listeningDevices.approvedAt))
		: [];

	return {
		deviceTypes: DEVICE_TYPES,
		connectionTypes: CONNECTION_TYPES,
		priceTiers: PRICE_TIERS,
		approvedDevices,
		existingDevice
	};
};

export const actions = {
	default: async ({ request, cookies, platform }) => {
		if (!platform) return fail(500, { error: 'Platform not available' });

		const data = await request.formData();
		const deviceId = data.get('device_id') as string | null;
		const deviceType = data.get('device_type') as string;
		const connectionType = data.get('connection_type') as string;
		const brand = data.get('brand') as string;
		const model = data.get('model') as string;
		const priceTier = data.get('price_tier') as string;

		const db = getDb(platform);

		// When client resolved a unique device by exact ID, reuse it directly (no create)
		if (deviceId) {
			const existing = await db
				.select({ id: listeningDevices.id })
				.from(listeningDevices)
				.where(eq(listeningDevices.id, deviceId))
				.limit(1)
				.get();
			if (existing) {
				cookies.set('device_id', existing.id, {
					path: '/',
					httpOnly: true,
					secure: import.meta.env.PROD,
					sameSite: 'lax',
					maxAge: 60 * 60 * 24 * 365
				});
				redirect(302, '/survey/play');
			}
		}

		if (!deviceType || !connectionType || !brand || !model || !priceTier) {
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

		const nBrand = normalize(brand);
		const nModel = normalize(model);

		// Reuse existing approved device with same attributes (dedup, case-insensitive brand/model)
		const existing = await db
			.select()
			.from(listeningDevices)
			.where(
				and(
					isNotNull(listeningDevices.approvedAt),
					eq(listeningDevices.deviceType, deviceType),
					eq(listeningDevices.connectionType, connectionType),
					eq(listeningDevices.priceTier, priceTier),
					sql`lower(trim(${listeningDevices.brand})) = ${nBrand}`,
					sql`lower(trim(${listeningDevices.model})) = ${nModel}`
				)
			)
			.limit(1)
			.get();

		let device: { id: string };
		if (existing) {
			device = existing;
		} else {
			const [inserted] = await db
				.insert(listeningDevices)
				.values({
					deviceType: deviceType as (typeof DEVICE_TYPES)[number],
					connectionType: connectionType as (typeof CONNECTION_TYPES)[number],
					brand: brand.trim(),
					model: model.trim(),
					priceTier: priceTier as (typeof PRICE_TIERS)[number]
				})
				.returning();

			if (!inserted) {
				return fail(500, { error: 'Failed to create device' });
			}
			device = inserted;
		}

		cookies.set('device_id', device.id, {
			path: '/',
			httpOnly: true,
			secure: import.meta.env.PROD,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 365 // 1 year
		});

		redirect(302, '/survey/play');
	}
} satisfies Actions;
