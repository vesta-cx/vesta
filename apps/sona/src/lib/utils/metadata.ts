/**
 * Utilities for extracting metadata from audio file tags.
 */

import { formatList } from '$lib/utils/list';

/** Matches http/https URLs in text. Stops at whitespace and common trailing punctuation. */
const URL_REGEX = /https?:\/\/[^\s"'<>)\]]+/g;

/** Matches (feat. ...), (ft. ...), (featuring ...) in titles. Case-insensitive. */
const FEAT_REGEX = /\(((?:feat\.?|ft\.?|featuring)\s+.+?)\)/i;

/**
 * Extract featured artists from a title like "Song (feat. Artist A, Artist B)".
 * Returns { featuredArtists, cleanTitle } — artists as semicolon-separated list, title with feat. part stripped.
 */
export const extractFeaturedFromTitle = (
	title: string | null | undefined
): { featuredArtists: string; cleanTitle: string } => {
	if (title == null || typeof title !== 'string')
		return { featuredArtists: '', cleanTitle: title ?? '' };
	const t = title.trim();
	const match = t.match(FEAT_REGEX);
	if (!match) return { featuredArtists: '', cleanTitle: t };
	const inner = match[1]?.replace(/^(?:feat\.?|ft\.?|featuring)\s+/i, '').trim() ?? '';
	// Split by comma, &, or " and " — normalize to semicolon-separated
	const artists = inner
		.split(/,\s*|\s+&\s+|\s+and\s+/i)
		.map((a) => a.trim())
		.filter(Boolean);
	return {
		featuredArtists: formatList(artists),
		cleanTitle: t
			.replace(FEAT_REGEX, '')
			.replace(/\s{2,}/g, ' ')
			.trim()
	};
};

/**
 * Extract the first URL found in comment text.
 * Handles music-metadata's IComment[] (object with text) and plain strings.
 * Returns null if no URL is present.
 */
export const extractUrlFromComment = (
	comment: { text?: string }[] | string | null | undefined
): string | null => {
	if (comment == null) return null;

	const texts: string[] = [];
	if (typeof comment === 'string') {
		texts.push(comment);
	} else if (Array.isArray(comment)) {
		for (const c of comment) {
			const t = typeof c === 'string' ? c : (c as { text?: string })?.text;
			if (typeof t === 'string' && t.trim()) texts.push(t);
		}
	}

	for (const text of texts) {
		const match = text.match(URL_REGEX);
		if (match?.[0]) {
			const url = match[0].replace(/[.,;:)]+$/, '');
			if (url.length > 0) return url;
		}
	}
	return null;
};
