import { redirect } from '@sveltejs/kit';
import { commitOAuthState, createOAuthState, readSessionCookie } from '@vesta-cx/auth';
import { createSonaAuthRuntime } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, platform, url }) => {
	if (!platform) return { error: 'Platform not available' };

	const runtime = createSonaAuthRuntime(platform);
	let authenticated = false;

	try {
		const existingSession = await runtime.authenticateSealedSession({
			sealedSession: readSessionCookie(cookies)
		});
		authenticated = existingSession.authenticated;
	} catch {
		authenticated = false;
	}

	if (authenticated) redirect(302, '/admin');

	const state = createOAuthState();
	commitOAuthState(cookies, state, undefined, undefined, url.protocol === 'https:');

	const authUrl = runtime.getAuthorizationUrl({
		redirectUri: `${url.origin}/auth/callback`,
		state
	});

	redirect(302, authUrl);
};
