/**
 * CORS utilities for strict origin allowlisting.
 * Use exact string matching only — never substring/suffix (see GHSA-vhxv-fg4m-p2w8).
 */

/**
 * Parse comma-separated origins string into trimmed array. Empty or whitespace entries are filtered.
 */
export const parseAllowedOrigins = (origins: string | undefined): string[] =>
	(origins ?? '')
		.split(',')
		.map((o) => o.trim())
		.filter(Boolean);

/**
 * Check if origin is allowed using exact match. Null/undefined origin (e.g. same-origin request) returns false.
 */
export const isOriginAllowed = (
	origin: string | null | undefined,
	allowlist: string[]
): boolean => {
	if (origin == null || origin === '') return false;
	return allowlist.includes(origin);
};

export { createCorsHandle } from './handle.js';
