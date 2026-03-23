/** @format */

import { redirect } from '@sveltejs/kit';
import { readSessionCookie } from '@vesta-cx/auth';
import { createWebAuthRuntime } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, platform, url }) => {
	if (!platform) {
		return { error: 'Platform not available' };
	}

	const runtime = createWebAuthRuntime(platform);
	const existingSession = await runtime.authenticateSealedSession({
		sealedSession: readSessionCookie(cookies)
	});

	if (existingSession.authenticated) {
		redirect(302, '/');
	}

	const authUrl = runtime.getAuthorizationUrl({
		redirectUri: `${url.origin}/auth/callback`
	});

	redirect(302, authUrl);
};
