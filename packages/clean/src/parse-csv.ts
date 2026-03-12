/** @format */

/**
 * Parse CSV string into trimmed non-empty segments.
 * Backslash escapes: `\,` is a literal comma; `\\` is a literal backslash.
 */
export const parseCsv = (value: string): string[] => {
	const BACKSLASH_PLACEHOLDER = "\uE000";
	const COMMA_PLACEHOLDER = "\uE001";
	const escaped = value
		.replace(/\\\\/g, BACKSLASH_PLACEHOLDER)
		.replace(/\\,/g, COMMA_PLACEHOLDER);
	return escaped
		.split(",")
		.map((entry) =>
			entry
				.trim()
				.replaceAll(COMMA_PLACEHOLDER, ",")
				.replaceAll(BACKSLASH_PLACEHOLDER, "\\"),
		)
		.filter(Boolean);
};
