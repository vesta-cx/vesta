/** @format */

import { error, redirect } from '@sveltejs/kit';
import {
	clearOAuthState,
	completeSvelteKitLogin,
	getRequestMetadata,
	isExpectedAuthenticationFailure,
	readOAuthState
} from '@vesta-cx/auth';
import { createWebAuthRuntime, createWebProvisioningAdapter } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, cookies, platform, request }) => {
	if (!platform) throw error(500, 'Platform not available');

	const code = url.searchParams.get('code');
	if (!code) throw error(400, 'Missing authorization code');

	const state = url.searchParams.get('state');
	const expectedState = readOAuthState(cookies);
	if (!state || !expectedState || state !== expectedState) {
		clearOAuthState(cookies);
		throw error(400, 'Invalid or missing state');
	}

	clearOAuthState(cookies);

	const runtime = createWebAuthRuntime(platform);
	const { ipAddress, userAgent } = getRequestMetadata(request, {
		trustCloudflare: true
	});

	try {
		await completeSvelteKitLogin({
			runtime,
			cookies,
			code,
			url,
			provisioningAdapter: createWebProvisioningAdapter(platform),
			...(ipAddress ? { ipAddress } : {}),
			...(userAgent ? { userAgent } : {})
		});
	} catch (input) {
		if (isExpectedAuthenticationFailure(input)) {
			throw error(401, 'Authentication failed');
		}

		throw input;
	}

	redirect(302, '/');
};
