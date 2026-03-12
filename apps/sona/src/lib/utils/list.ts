/**
 * Utilities for semicolon-separated list storage (e.g. artists, genres).
 * Stored as "Artist A; Artist B" in DB. Use \; for semicolons in names, \\ for backslashes.
 */

/** Unescape a token: \\ → \, \; → ; (for user input before adding as tag). */
export const unescapeToken = (s: string): string => {
	let r = '';
	for (let i = 0; i < s.length; i++) {
		if (s[i] === '\\' && i + 1 < s.length) {
			r += s[i + 1];
			i++;
		} else {
			r += s[i];
		}
	}
	return r;
};

/** Escape for storage: \ → \\, ; → \; */
const escapeToken = (s: string): string => {
	return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;');
};

/**
 * Split by semicolon (respecting \; escapes), trim each, filter empty.
 * Handles null/undefined.
 */
export const parseList = (s: string | null | undefined): string[] => {
	if (s == null || typeof s !== 'string') return [];
	const result: string[] = [];
	let current = '';
	for (let i = 0; i < s.length; i++) {
		if (s[i] === '\\' && i + 1 < s.length) {
			current += s[i + 1];
			i++;
		} else if (s[i] === ';') {
			result.push(current.trim());
			current = '';
		} else {
			current += s[i];
		}
	}
	result.push(current.trim());
	return result.filter((part) => part.length > 0);
};

/** Join with "; " for storage. Escapes ; and \ in each item. */
export const formatList = (arr: string[]): string => {
	if (!Array.isArray(arr) || arr.length === 0) return '';
	return arr
		.map((s) => escapeToken(String(s).trim()))
		.filter(Boolean)
		.join('; ');
};

/** Format artists for display: "artist1, artist2 & artist3" (last two joined with " & "). */
export const formatArtistsForDisplay = (s: string | string[] | null | undefined): string => {
	const arr = Array.isArray(s) ? s : parseList(s);
	if (arr.length === 0) return '';
	if (arr.length === 1) return arr[0];
	if (arr.length === 2) return `${arr[0]} & ${arr[1]}`;
	return arr.slice(0, -1).join(', ') + ' & ' + (arr.at(-1) ?? '');
};

type TrackLabelInput = {
	title: string;
	artist?: string | null;
	featuredArtists?: string | null;
	remixArtists?: string | null;
};

/**
 * Format track label for display (single-line):
 * <main_artists> — <song_title> <(feat. featured)> <(remix)>
 */
export const formatTrackLabel = (l: TrackLabelInput): string => {
	const main = formatArtistsForDisplay(l.artist);
	const feat = formatArtistsForDisplay(l.featuredArtists);
	const remix = formatArtistsForDisplay(l.remixArtists);

	const titlePart = l.title.trim() || 'Unknown';
	const featPart = feat ? ` (feat. ${feat})` : '';
	const remixPart = remix ? ` (${remix} Remix)` : '';

	if (!main) return titlePart + featPart + remixPart;
	return `${main} — ${titlePart}${featPart}${remixPart}`;
};

/**
 * Format track label for display (multiline):
 * Line 1: <song_title> <remix_artists>
 * Line 2: <main_artists> <featured_artists>
 */
export const formatTrackLabelMultiline = (l: TrackLabelInput): string => {
	const main = formatArtistsForDisplay(l.artist);
	const feat = formatArtistsForDisplay(l.featuredArtists);
	const remix = formatArtistsForDisplay(l.remixArtists);

	const titlePart = l.title.trim() || 'Unknown';
	const featPart = feat ? ` (feat. ${feat})` : '';
	const remixPart = remix ? ` (${remix} Remix)` : '';

	const line1 = titlePart + remixPart;
	const line2 = main + featPart;

	if (!line2.trim()) return line1;
	return `${line1}\n${line2}`;
};
