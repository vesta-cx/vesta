import { error, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { users } from '@vesta-cx/db';
import { getDb } from '$lib/server/db';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, platform }) => {
	// hooks.server.ts protects /dashboard, but guard explicitly so the layout
	// always has a session when it renders.
	if (!locals.session) redirect(302, '/auth/login');
	if (!platform) error(500, 'Platform not available');

	const { firstName, lastName, email, profilePictureUrl, userId } = locals.session;
	const legalName = [firstName, lastName].filter(Boolean).join(' ');

	const db = getDb(platform);
	const [profile] = await db
		.select({
			handle: users.handle,
			displayName: users.displayName,
			bio: users.bio
		})
		.from(users)
		.where(eq(users.workosUserId, userId))
		.limit(1);

	return {
		user: {
			name: legalName || email,
			email,
			avatarUrl: profilePictureUrl ?? undefined,
			displayName: profile?.displayName ?? legalName ?? email,
			handle: profile?.handle ?? null,
			bio: profile?.bio ?? null
		}
	};
};
