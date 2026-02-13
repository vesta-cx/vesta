import type { CookieConfig } from "./types.js";

let config: CookieConfig = {};

/**
 * Set global cookie configuration (call once at app startup).
 * Primarily used to set `domain` for cross-subdomain sharing.
 *
 * ```ts
 * configureCookies({ domain: '.vesta.cx' });
 * ```
 */
export const configureCookies = (opts: CookieConfig): void => {
	config = { ...opts };
};

export const getCookieConfig = (): Readonly<CookieConfig> => config;
