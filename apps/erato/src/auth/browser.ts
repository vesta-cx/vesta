/** @format */

import {
	DEFAULT_AUTH_COOKIE_NAME,
	DEFAULT_OAUTH_STATE_COOKIE_NAME,
	DEFAULT_OAUTH_STATE_MAX_AGE,
	DEFAULT_SESSION_MAX_AGE,
	createOAuthState,
	getRequestMetadata,
	isExpectedAuthenticationFailure,
} from "@vesta-cx/auth";
import type { Context } from "hono";
import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { API_BASE_PATH } from "../config/api-version";
import type { AppEnv } from "../env";
import { singleError } from "../lib/errors";
import {
	createEratoAuthRuntime,
	createEratoProvisioningAdapter,
} from "./runtime";

const COOKIE_PATH = "/";
const RETURN_TO_COOKIE_NAME = "vesta_erato_return_to";

const cookieOptions = (url: URL, maxAge: number) => ({
	path: COOKIE_PATH,
	httpOnly: true,
	sameSite: "Lax" as const,
	maxAge,
	secure: url.protocol === "https:",
});

const isSafeReturnPath = (value: string | null): value is string =>
	!!value && value.startsWith("/") && !value.startsWith("//");

export const startBrowserLogin = (c: Context<AppEnv>) => {
	const url = new URL(c.req.url);
	const state = createOAuthState();
	setCookie(
		c,
		DEFAULT_OAUTH_STATE_COOKIE_NAME,
		state,
		cookieOptions(url, DEFAULT_OAUTH_STATE_MAX_AGE),
	);

	const returnTo = url.searchParams.get("return_to");
	if (isSafeReturnPath(returnTo)) {
		setCookie(
			c,
			RETURN_TO_COOKIE_NAME,
			returnTo,
			cookieOptions(url, DEFAULT_OAUTH_STATE_MAX_AGE),
		);
	}

	const authUrl = createEratoAuthRuntime(c.env).getAuthorizationUrl({
		redirectUri: `${url.origin}${API_BASE_PATH}/auth/callback`,
		state,
	});

	return c.redirect(authUrl, 302);
};

export const browserAuthRoutes = new Hono<AppEnv>();

browserAuthRoutes.get("/auth/callback", async (c) => {
	const url = new URL(c.req.url);
	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state");
	const storedState = getCookie(c, DEFAULT_OAUTH_STATE_COOKIE_NAME);
	const returnTo = getCookie(c, RETURN_TO_COOKIE_NAME);
	deleteCookie(c, DEFAULT_OAUTH_STATE_COOKIE_NAME, { path: COOKIE_PATH });
	deleteCookie(c, RETURN_TO_COOKIE_NAME, { path: COOKIE_PATH });

	if (!code) {
		return singleError(
			c,
			400,
			"Missing authorization code",
			"AUTH_CALLBACK_INVALID",
		);
	}

	if (!state || !storedState || state !== storedState) {
		return singleError(
			c,
			400,
			"Invalid or missing OAuth state",
			"AUTH_CALLBACK_INVALID",
		);
	}

	try {
		const runtime = createEratoAuthRuntime(c.env);
		const { ipAddress, userAgent } = getRequestMetadata(c.req.raw, {
			trustCloudflare: true,
			trustForwardedFor: true,
		});
		const exchange = await runtime.authenticateWithCode({
			code,
			resolveMemberships: true,
			provisioningAdapter: createEratoProvisioningAdapter(
				c.env,
			),
			ipAddress: ipAddress ?? undefined,
			userAgent: userAgent ?? undefined,
		});

		setCookie(
			c,
			DEFAULT_AUTH_COOKIE_NAME,
			exchange.sealedSession,
			cookieOptions(url, DEFAULT_SESSION_MAX_AGE),
		);

		return c.redirect(
			isSafeReturnPath(returnTo) ? returnTo : (
				`${API_BASE_PATH}/me`
			),
			302,
		);
	} catch (error) {
		if (isExpectedAuthenticationFailure(error)) {
			return singleError(
				c,
				401,
				"Authentication failed",
				"AUTH_CALLBACK_FAILED",
			);
		}

		throw error;
	}
});
