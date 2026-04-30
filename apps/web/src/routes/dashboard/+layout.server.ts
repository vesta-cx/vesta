import { error, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { users } from '@vesta-cx/db';
import { createWebAuthRuntime } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, platform }) => {
	// hooks.server.ts protects /dashboard, but guard explicitly so the layout
	// always has a session when it renders.
	if (!locals.session) redirect(302, '/auth/login');
	if (!platform) error(500, 'Platform not available');

	const { firstName, lastName, email, emailVerified, profilePictureUrl, userId } = locals.session;
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

	let authFactors: Awaited<ReturnType<ReturnType<typeof createWebAuthRuntime>['listAuthFactors']>> =
		[];
	let securityUnavailable = false;
	try {
		authFactors = await createWebAuthRuntime(platform).listAuthFactors({ userId });
	} catch {
		securityUnavailable = true;
	}

	return {
		user: {
			name: legalName || email,
			email,
			emailVerified,
			avatarUrl: profilePictureUrl ?? undefined,
			displayName: profile?.displayName ?? legalName ?? email,
			handle: profile?.handle ?? null,
			bio: profile?.bio ?? null
		},
		security: {
			unavailable: securityUnavailable,
			authFactors
		}
	};
};
