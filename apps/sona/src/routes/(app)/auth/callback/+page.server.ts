import { redirect, error } from '@sveltejs/kit';
import { authenticateWithCode, createSession } from '@vesta-cx/utils/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, cookies, platform }) => {
	if (!platform) return error(500, 'Platform not available');

	const code = url.searchParams.get('code');
	if (!code) return error(400, 'Missing authorization code');

	const result = await authenticateWithCode({
		code,
		clientId: platform.env.PRIVATE_WORKOS_CLIENT_ID,
		apiKey: platform.env.PRIVATE_WORKOS_API_KEY
	});

	if (!result) return error(401, 'Authentication failed');

	await createSession(
		cookies,
		{
			userId: result.user.id,
			email: result.user.email,
			organizationId: result.organizationId ?? platform.env.PRIVATE_WORKOS_ORG_ID,
			firstName: result.user.first_name ?? undefined,
			lastName: result.user.last_name ?? undefined,
			profilePictureUrl: result.user.profile_picture_url ?? undefined,
			accessToken: result.accessToken,
			refreshToken: result.refreshToken
		},
		platform.env.PRIVATE_WORKOS_COOKIE_PASSWORD
	);

	redirect(302, '/admin');
};
