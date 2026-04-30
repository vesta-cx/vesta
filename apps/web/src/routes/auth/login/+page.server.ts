/** @format */

import { error, redirect } from '@sveltejs/kit';
import { authenticateSvelteKitSession, commitOAuthState, createOAuthState } from '@vesta-cx/auth';
import { createWebAuthRuntime } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, platform, url }) => {
	if (!platform) {
		throw error(500, 'Platform not available');
	}

	const runtime = createWebAuthRuntime(platform);
	const existingSession = await authenticateSvelteKitSession({ runtime, cookies });

	if (existingSession.authenticated) {
		redirect(302, '/dashboard');
	}

	const state = createOAuthState();
	commitOAuthState(cookies, state, { secure: url.protocol === 'https:' });

	const authUrl = runtime.getAuthorizationUrl({
		redirectUri: `${url.origin}/auth/callback`,
		state
	});

	redirect(302, authUrl);
};
