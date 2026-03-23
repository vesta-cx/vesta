/** @format */

import { redirect } from '@sveltejs/kit';
import { clearSealedSession, readSessionCookie } from '@vesta-cx/auth';
import { createWebAuthRuntime } from '$lib/server/auth';
import type { RequestHandler } from './$types';

const handleLogout: RequestHandler = async ({ cookies, platform, url }) => {
	const runtime = platform ? createWebAuthRuntime(platform) : null;
	let workosLogoutUrl: string | null = null;

	if (runtime) {
		workosLogoutUrl = await runtime.getLogoutUrl({
			sealedSession: readSessionCookie(cookies),
			returnTo: url.origin
		});
	}

	clearSealedSession(cookies);
	redirect(302, workosLogoutUrl ?? '/');
};

export const GET = handleLogout;
export const POST = handleLogout;
