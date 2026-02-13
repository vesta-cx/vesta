import type { Handle } from "@sveltejs/kit";
import type { AuthEnv, AuthHandleConfig, AuthSession } from "./types.js";
import { getSession } from "./session.js";

const DEFAULT_LOGIN_PATH = "/auth/login";
const DEFAULT_COOKIE_NAME = "session";

/**
 * Create a SvelteKit `Handle` that enforces authentication on protected paths.
 *
 * - Reads the sealed session cookie on every request
 * - Attaches `session` to `event.locals` when authenticated
 * - Redirects to `loginPath` when an unauthenticated user hits a protected path
 *
 * Compose with other hooks via `sequence()`:
 * ```ts
 * import { sequence } from '@sveltejs/kit/hooks';
 * import { createAuthHandle } from '@vesta-cx/utils/auth';
 *
 * const auth = createAuthHandle({ protectedPaths: ['/admin'] });
 * export const handle = sequence(auth, otherHandle);
 * ```
 */
export const createAuthHandle = (config: AuthHandleConfig): Handle => {
	const {
		protectedPaths,
		loginPath = DEFAULT_LOGIN_PATH,
		cookieName = DEFAULT_COOKIE_NAME,
	} = config;

	return async ({ event, resolve }) => {
		const { pathname } = event.url;

		// Always try to hydrate the session into locals (cheap no-op when no cookie)
		const env = (event.platform as { env: AuthEnv } | undefined)?.env;
		if (env) {
			const session = await getSession(
				event.cookies,
				env.PRIVATE_WORKOS_COOKIE_PASSWORD,
				cookieName,
			);
			if (session) {
				(event.locals as { session?: AuthSession }).session = session;
			}
		}

		// Enforce auth on protected paths
		const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
		if (isProtected && !(event.locals as { session?: AuthSession }).session) {
			// Return a raw 302 Response instead of SvelteKit's redirect() to avoid
			// dual-instance issues when @sveltejs/kit resolves differently in the
			// shared utils package vs the consuming app.
			return new Response(null, {
				status: 302,
				headers: { location: loginPath },
			});
		}

		return resolve(event);
	};
};
