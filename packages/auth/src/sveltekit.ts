/** @format */

import type { Cookies, Handle } from "@sveltejs/kit";
import {
	DEFAULT_AUTH_COOKIE_NAME,
	DEFAULT_LOGIN_PATH,
	DEFAULT_SESSION_MAX_AGE,
} from "./constants.js";
import type { AuthProvisioningAdapter, AuthSession } from "./types.js";
import type { AuthRuntime } from "./runtime.js";

export interface SvelteKitAuthHandleConfig {
	runtime: AuthRuntime;
	protectedPaths: string[];
	loginPath?: string;
	cookieName?: string;
	sessionMaxAge?: number;
	preferredOrganizationId?: string;
	resolveMemberships?: boolean;
	provisioningAdapter?: AuthProvisioningAdapter;
}

export interface CompleteSvelteKitLoginInput {
	runtime: AuthRuntime;
	cookies: Cookies;
	code: string;
	cookieName?: string;
	sessionMaxAge?: number;
	preferredOrganizationId?: string;
	resolveMemberships?: boolean;
	provisioningAdapter?: AuthProvisioningAdapter;
	ipAddress?: string;
	userAgent?: string;
}

const sessionCookieOptions = (maxAge: number) => ({
	path: "/",
	httpOnly: true,
	secure: true,
	sameSite: "lax" as const,
	maxAge,
});

export const readSessionCookie = (
	cookies: Cookies,
	cookieName = DEFAULT_AUTH_COOKIE_NAME,
): string | undefined => cookies.get(cookieName);

export const commitSealedSession = (
	cookies: Cookies,
	sealedSession: string,
	cookieName = DEFAULT_AUTH_COOKIE_NAME,
	maxAge = DEFAULT_SESSION_MAX_AGE,
): void => {
	cookies.set(cookieName, sealedSession, sessionCookieOptions(maxAge));
};

export const clearSealedSession = (
	cookies: Cookies,
	cookieName = DEFAULT_AUTH_COOKIE_NAME,
): void => {
	cookies.delete(cookieName, { path: "/" });
};

export const completeSvelteKitLogin = async (
	input: CompleteSvelteKitLoginInput,
): Promise<AuthSession> => {
	const exchange = await input.runtime.authenticateWithCode({
		code: input.code,
		...(input.ipAddress ? { ipAddress: input.ipAddress } : {}),
		...(input.userAgent ? { userAgent: input.userAgent } : {}),
		...(input.preferredOrganizationId ?
			{
				preferredOrganizationId:
					input.preferredOrganizationId,
			}
		:	{}),
		resolveMemberships: input.resolveMemberships ?? true,
		...(input.provisioningAdapter ?
			{ provisioningAdapter: input.provisioningAdapter }
		:	{}),
	});

	commitSealedSession(
		input.cookies,
		exchange.sealedSession,
		input.cookieName,
		input.sessionMaxAge,
	);

	return exchange.session;
};

export const getRequestMetadata = (
	request: Request,
): {
	ipAddress: string | undefined;
	userAgent: string | undefined;
} => ({
	ipAddress: undefined,
	userAgent: request.headers.get("user-agent") ?? undefined,
});

export const createAuthHandle = (config: SvelteKitAuthHandleConfig): Handle => {
	const loginPath = config.loginPath ?? DEFAULT_LOGIN_PATH;
	const cookieName = config.cookieName ?? DEFAULT_AUTH_COOKIE_NAME;
	const sessionMaxAge = config.sessionMaxAge ?? DEFAULT_SESSION_MAX_AGE;

	return async ({ event, resolve }) => {
		const existing = readSessionCookie(event.cookies, cookieName);
		let session: AuthSession | null = null;

		try {
			const result =
				await config.runtime.authenticateSealedSession({
					sealedSession: existing,
					resolveMemberships:
						config.resolveMemberships ??
						false,
					...(config.preferredOrganizationId ?
						{
							preferredOrganizationId:
								config.preferredOrganizationId,
						}
					:	{}),
					...(config.provisioningAdapter ?
						{
							provisioningAdapter:
								config.provisioningAdapter,
						}
					:	{}),
				});

			if (result.authenticated) {
				session = result.session;

				if (result.refreshed && result.sealedSession) {
					commitSealedSession(
						event.cookies,
						result.sealedSession,
						cookieName,
						sessionMaxAge,
					);
				}
			} else if (existing) {
				clearSealedSession(event.cookies, cookieName);
			}
		} catch {
			if (existing) {
				clearSealedSession(event.cookies, cookieName);
			}
		}

		(
			event.locals as {
				session: AuthSession | null;
			}
		).session = session;

		const isProtected = config.protectedPaths.some((path) =>
			event.url.pathname.startsWith(path),
		);

		if (isProtected && !session) {
			return new Response(null, {
				status: 302,
				headers: {
					location: loginPath,
				},
			});
		}

		return resolve(event);
	};
};
