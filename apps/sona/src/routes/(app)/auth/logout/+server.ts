import { redirect } from '@sveltejs/kit';
import { clearSession, getSession, getLogoutUrl } from '@vesta-cx/utils/auth';
import type { RequestHandler } from './$types';

const handleLogout: RequestHandler = async ({ cookies, platform, url }) => {
	const cookiePassword = platform?.env?.PRIVATE_WORKOS_COOKIE_PASSWORD;
	let workosLogoutUrl: string | null = null;

	// Try to build the WorkOS logout URL before clearing the session
	if (cookiePassword) {
		const session = await getSession(cookies, cookiePassword);
		if (session?.accessToken) {
			workosLogoutUrl = getLogoutUrl({
				accessToken: session.accessToken,
				returnTo: url.origin
			});
		}
	}

	// Always clear the local session cookie
	clearSession(cookies);

	// Redirect through WorkOS to end the SSO session, or fall back to home
	redirect(302, workosLogoutUrl ?? '/');
};

export const GET = handleLogout;
export const POST = handleLogout;
