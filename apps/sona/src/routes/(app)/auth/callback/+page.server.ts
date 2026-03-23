import { redirect, error } from '@sveltejs/kit';
import { completeSvelteKitLogin, getRequestMetadata } from '@vesta-cx/auth';
import { createSonaAuthRuntime } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, cookies, platform, request }) => {
	if (!platform) return error(500, 'Platform not available');

	const code = url.searchParams.get('code');
	if (!code) return error(400, 'Missing authorization code');

	const runtime = createSonaAuthRuntime(platform);
	const { ipAddress, userAgent } = getRequestMetadata(request);

	await completeSvelteKitLogin({
		runtime,
		cookies,
		code,
		...(ipAddress ? { ipAddress } : {}),
		...(userAgent ? { userAgent } : {})
	}).catch(() => {
		error(401, 'Authentication failed');
	});

	redirect(302, '/admin');
};
