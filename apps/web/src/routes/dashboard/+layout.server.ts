import { error, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { handles, users } from '@vesta-cx/db';
import { createWebAuthRuntime } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, platform }) => {
	// hooks.server.ts protects /dashboard, but guard explicitly so the layout
	// always has a session when it renders.
	if (!locals.session) redirect(302, '/auth/login');
	if (!platform) error(500, 'Platform not available');

	const { userId } = locals.session;
	const runtime = createWebAuthRuntime(platform);
	const account = await runtime.getUser({ userId });
	const legalName = [account.firstName, account.lastName].filter(Boolean).join(' ');

	const db = getDb(platform);
	const [profile] = await db
		.select({
			handle: handles.handle,
			displayName: users.displayName,
			bio: users.bio
		})
		.from(users)
		.leftJoin(
			handles,
			and(eq(handles.subjectId, users.workosUserId), eq(handles.subjectType, 'user'))
		)
		.where(eq(users.workosUserId, userId))
		.limit(1);

	let authFactors: Awaited<ReturnType<ReturnType<typeof createWebAuthRuntime>['listAuthFactors']>> =
		[];
	let sessions: Awaited<ReturnType<ReturnType<typeof createWebAuthRuntime>['listSessions']>> = [];
	let securityUnavailable = false;
	try {
		[authFactors, sessions] = await Promise.all([
			runtime.listAuthFactors({ userId }),
			runtime.listSessions({ userId })
		]);
	} catch {
		securityUnavailable = true;
	}

	return {
		user: {
			name: legalName || account.email,
			firstName: account.firstName ?? '',
			lastName: account.lastName ?? '',
			email: account.email,
			emailVerified: account.emailVerified,
			avatarUrl: account.profilePictureUrl ?? undefined,
			displayName: profile?.displayName ?? legalName ?? account.email,
			handle: profile?.handle ?? null,
			bio: profile?.bio ?? null
		},
		security: {
			unavailable: securityUnavailable,
			authFactors,
			sessions,
			currentSessionId: locals.session.sessionId
		}
	};
};
