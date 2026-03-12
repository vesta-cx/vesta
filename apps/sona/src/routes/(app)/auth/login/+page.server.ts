import { redirect } from '@sveltejs/kit';
import { getAuthorizationUrl, getSession } from '@vesta-cx/utils/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, platform, url }) => {
	if (!platform) return { error: 'Platform not available' };

	// Already logged in?
	const session = await getSession(cookies, platform.env.PRIVATE_WORKOS_COOKIE_PASSWORD);
	if (session) redirect(302, '/admin');

	const redirectUri = `${url.origin}/auth/callback`;
	const authUrl = getAuthorizationUrl({
		clientId: platform.env.PRIVATE_WORKOS_CLIENT_ID,
		redirectUri,
		organizationId: platform.env.PRIVATE_WORKOS_ORG_ID
	});

	redirect(302, authUrl);
};
