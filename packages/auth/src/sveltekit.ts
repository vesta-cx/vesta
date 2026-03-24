/** @format */

import type { Cookies, Handle } from "@sveltejs/kit";
import {
	DEFAULT_AUTH_COOKIE_NAME,
	DEFAULT_LOGIN_PATH,
	DEFAULT_OAUTH_STATE_COOKIE_NAME,
	DEFAULT_OAUTH_STATE_MAX_AGE,
	DEFAULT_SESSION_MAX_AGE,
} from "./constants.js";
import { TerminalAuthError } from "./errors.js";
import type {
	AuthProvisioningAdapter,
	AuthSession,
	AuthSessionFailureReason,
	AuthSessionResult,
} from "./types.js";
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
	/** Request URL; used to set secure flag when protocol is https. */
	url?: URL;
}

export interface AuthenticateSvelteKitSessionInput {
	runtime: AuthRuntime;
	cookies: Cookies;
	cookieName?: string;
	clearInvalidCookie?: boolean;
	preferredOrganizationId?: string;
	resolveMemberships?: boolean;
	provisioningAdapter?: AuthProvisioningAdapter;
}

const cookieOptions = (maxAge: number, secure?: boolean) => ({
	path: "/",
	httpOnly: true,
	sameSite: "lax" as const,
	maxAge,
	...(secure ? { secure: true } : {}),
});

const unauthenticatedSession = (
	reason: AuthSessionFailureReason,
): AuthSessionResult => ({
	authenticated: false,
	refreshed: false,
	reason,
	sealedSession: null,
	session: null,
});

const isRecoverableLoadSessionError = (
	error: unknown,
): error is TerminalAuthError =>
	error instanceof TerminalAuthError &&
	error.operation === "loadSealedSession";

const normalizeProtectedPath = (path: string): string =>
	path === "/" ? "/" : path.replace(/\/+$/, "");

const matchesProtectedPath = (
	pathname: string,
	protectedPath: string,
): boolean => {
	const normalizedProtectedPath = normalizeProtectedPath(protectedPath);

	return (
		normalizedProtectedPath === "/" ||
		pathname === normalizedProtectedPath ||
		pathname.startsWith(`${normalizedProtectedPath}/`)
	);
};

export const readSessionCookie = (
	cookies: Cookies,
	cookieName = DEFAULT_AUTH_COOKIE_NAME,
): string | undefined => cookies.get(cookieName);

export const commitSealedSession = (
	cookies: Cookies,
	sealedSession: string,
	cookieName = DEFAULT_AUTH_COOKIE_NAME,
	maxAge = DEFAULT_SESSION_MAX_AGE,
	secure?: boolean,
): void => {
	cookies.set(cookieName, sealedSession, cookieOptions(maxAge, secure));
};

export const clearSealedSession = (
	cookies: Cookies,
	cookieName = DEFAULT_AUTH_COOKIE_NAME,
): void => {
	cookies.delete(cookieName, { path: "/" });
};

export const createOAuthState = (): string => crypto.randomUUID();

export const readOAuthState = (
	cookies: Cookies,
	cookieName = DEFAULT_OAUTH_STATE_COOKIE_NAME,
): string | undefined => cookies.get(cookieName);

export const commitOAuthState = (
	cookies: Cookies,
	state: string,
	cookieName = DEFAULT_OAUTH_STATE_COOKIE_NAME,
	maxAge = DEFAULT_OAUTH_STATE_MAX_AGE,
	secure?: boolean,
): void => {
	cookies.set(cookieName, state, cookieOptions(maxAge, secure));
};

export const clearOAuthState = (
	cookies: Cookies,
	cookieName = DEFAULT_OAUTH_STATE_COOKIE_NAME,
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

	const secure = input.url?.protocol === "https:";
	commitSealedSession(
		input.cookies,
		exchange.sealedSession,
		input.cookieName,
		input.sessionMaxAge,
		secure,
	);

	return exchange.session;
};

export const authenticateSvelteKitSession = async (
	input: AuthenticateSvelteKitSessionInput,
): Promise<AuthSessionResult> => {
	const cookieName = input.cookieName ?? DEFAULT_AUTH_COOKIE_NAME;

	try {
		return await input.runtime.authenticateSealedSession({
			sealedSession: readSessionCookie(
				input.cookies,
				cookieName,
			),
			resolveMemberships: input.resolveMemberships ?? false,
			...(input.preferredOrganizationId ?
				{
					preferredOrganizationId:
						input.preferredOrganizationId,
				}
			:	{}),
			...(input.provisioningAdapter ?
				{
					provisioningAdapter:
						input.provisioningAdapter,
				}
			:	{}),
		});
	} catch (error) {
		if (isRecoverableLoadSessionError(error)) {
			if (input.clearInvalidCookie !== false) {
				clearSealedSession(input.cookies, cookieName);
			}
			return unauthenticatedSession("invalid_session");
		}

		throw error;
	}
};

export const getRequestMetadata = (
	request: Request,
): {
	ipAddress: string | undefined;
	userAgent: string | undefined;
} => {
	const ipAddress =
		request.headers.get("cf-connecting-ip") ??
		request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
		undefined;

	return {
		ipAddress,
		userAgent: request.headers.get("user-agent") ?? undefined,
	};
};

export const createAuthHandle = (config: SvelteKitAuthHandleConfig): Handle => {
	const loginPath = config.loginPath ?? DEFAULT_LOGIN_PATH;
	const cookieName = config.cookieName ?? DEFAULT_AUTH_COOKIE_NAME;
	const sessionMaxAge = config.sessionMaxAge ?? DEFAULT_SESSION_MAX_AGE;

	return async ({ event, resolve }) => {
		const existing = readSessionCookie(event.cookies, cookieName);
		let session: AuthSession | null = null;

		const result = await authenticateSvelteKitSession({
			runtime: config.runtime,
			cookies: event.cookies,
			cookieName,
			clearInvalidCookie: false,
			resolveMemberships: config.resolveMemberships ?? false,
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
				const secure = event.url.protocol === "https:";
				commitSealedSession(
					event.cookies,
					result.sealedSession,
					cookieName,
					sessionMaxAge,
					secure,
				);
			}
		} else if (existing) {
			clearSealedSession(event.cookies, cookieName);
		}

		(
			event.locals as {
				session: AuthSession | null;
			}
		).session = session;

		const isProtected = config.protectedPaths.some((path) =>
			matchesProtectedPath(event.url.pathname, path),
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
