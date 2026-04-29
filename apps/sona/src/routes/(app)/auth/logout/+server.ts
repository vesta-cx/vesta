import { redirect } from '@sveltejs/kit';
import { clearSealedSession, readSessionCookie } from '@vesta-cx/auth';
import { createSonaAuthRuntime } from '$lib/server/auth';
import type { RequestHandler } from './$types';

const handleLogout: RequestHandler = async ({ cookies, platform, url }) => {
	const runtime = platform ? createSonaAuthRuntime(platform) : null;
	let workosLogoutUrl: string | null = null;

	try {
		if (runtime) {
			workosLogoutUrl = await runtime.getLogoutUrl({
				sealedSession: readSessionCookie(cookies),
				returnTo: url.origin
			});
		}
	} catch {
		workosLogoutUrl = null;
	} finally {
		clearSealedSession(cookies);
	}

	redirect(302, workosLogoutUrl ?? '/');
};

export const POST = handleLogout;
