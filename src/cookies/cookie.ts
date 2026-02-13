import { ONE_YEAR } from "../constants.js";
import { getCookieConfig } from "./config.js";
import type { CookieAttributes } from "./types.js";

const isBrowser = typeof document !== "undefined";

/** Parse all cookies into a key→value record. */
export const getCookies = (): Record<string, string> => {
	if (!isBrowser) return {};

	const result: Record<string, string> = {};
	for (const part of document.cookie.split(";")) {
		const trimmed = part.trim();
		if (!trimmed) continue;
		const eqIdx = trimmed.indexOf("=");
		if (eqIdx === -1) continue;
		const key = decodeURIComponent(trimmed.slice(0, eqIdx));
		const value = decodeURIComponent(trimmed.slice(eqIdx + 1));
		result[key] = value;
	}
	return result;
};

/** Read a single cookie by key. */
export const getCookie = (key: string): string | undefined => {
	return getCookies()[key];
};

/**
 * Set a cookie. Merges the global `domain` from `configureCookies()` into
 * attributes unless an explicit domain is provided.
 */
export const setCookie = (
	key: string,
	value: string,
	attributes: CookieAttributes = { "max-age": ONE_YEAR, samesite: "lax" },
): string | undefined => {
	if (!isBrowser) return undefined;

	const globalConfig = getCookieConfig();
	const merged: CookieAttributes = {
		...(globalConfig.domain ? { domain: globalConfig.domain } : {}),
		...attributes,
	};

	// SameSite=None requires Secure
	if (merged.samesite === "none") merged.secure = true;

	let cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;

	for (const [attr, val] of Object.entries(merged)) {
		if (val === undefined) continue;
		switch (attr) {
			case "expires":
				cookie += `; expires=${(val as Date).toUTCString()}`;
				break;
			case "partitioned":
			case "secure":
				if (val) cookie += `; ${attr}`;
				break;
			default:
				cookie += `; ${attr}=${String(val)}`;
				break;
		}
	}

	document.cookie = cookie;
	return getCookie(key);
};

/** Delete a cookie by expiring it immediately. */
export const deleteCookie = (key: string): void => {
	if (!isBrowser) return;
	const globalConfig = getCookieConfig();
	// Must include domain + path to match the original cookie
	setCookie(key, "", {
		"max-age": 0,
		path: "/",
		...(globalConfig.domain ? { domain: globalConfig.domain } : {}),
	});
};
