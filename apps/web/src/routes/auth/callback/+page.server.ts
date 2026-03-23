/** @format */

import { error, redirect } from '@sveltejs/kit';
import { completeSvelteKitLogin, getRequestMetadata } from '@vesta-cx/auth';
import { createWebAuthRuntime, createWebProvisioningAdapter } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, cookies, platform, request }) => {
	if (!platform) return error(500, 'Platform not available');

	const code = url.searchParams.get('code');
	if (!code) return error(400, 'Missing authorization code');

	const runtime = createWebAuthRuntime(platform);
	const { ipAddress, userAgent } = getRequestMetadata(request);

	try {
		await completeSvelteKitLogin({
			runtime,
			cookies,
			code,
			provisioningAdapter: createWebProvisioningAdapter(platform),
			...(ipAddress ? { ipAddress } : {}),
			...(userAgent ? { userAgent } : {})
		});
	} catch {
		return error(401, 'Authentication failed');
	}

	redirect(302, '/');
};
