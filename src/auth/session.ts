import * as Iron from "iron-webcrypto";
import type { Cookies } from "@sveltejs/kit";
import type { AuthSession } from "./types.js";

const DEFAULT_COOKIE_NAME = "session";
const DEFAULT_MAX_AGE = 60 * 60 * 24; // 24 hours

export const createSession = async (
	cookies: Cookies,
	session: AuthSession,
	cookiePassword: string,
	cookieName = DEFAULT_COOKIE_NAME,
	maxAge = DEFAULT_MAX_AGE,
): Promise<void> => {
	const sealed = await Iron.seal(session, cookiePassword, Iron.defaults);

	cookies.set(cookieName, sealed, {
		path: "/",
		httpOnly: true,
		secure: true,
		sameSite: "lax",
		maxAge,
	});
};

export const getSession = async (
	cookies: Cookies,
	cookiePassword: string,
	cookieName = DEFAULT_COOKIE_NAME,
): Promise<AuthSession | null> => {
	const raw = cookies.get(cookieName);
	if (!raw) return null;

	try {
		return (await Iron.unseal(
			raw,
			cookiePassword,
			Iron.defaults,
		)) as AuthSession;
	} catch {
		cookies.delete(cookieName, { path: "/" });
		return null;
	}
};

export const clearSession = (
	cookies: Cookies,
	cookieName = DEFAULT_COOKIE_NAME,
): void => {
	cookies.delete(cookieName, { path: "/" });
};
