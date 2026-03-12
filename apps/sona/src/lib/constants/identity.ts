/**
 * Site identity and metadata — single source of truth for branding, SEO, and shared links.
 * Update this file when changing the site name, taglines, domains, or head content.
 */

export const SITE_NAME = 'Sona';
export const ORG_NAME = 'Vesta';

/** Main tagline (hero, default title) */
export const TAGLINE = 'Can you hear the difference?';

/** Short tagline for meta description and subheads */
export const TAGLINE_SHORT = 'Put your ears to the test, and help us build better streaming.';

/** Full meta description for SEO (home page and default og:description) */
export const META_DESCRIPTION =
	'Put your ears to the test, and help us build better streaming. Blind A/B audio comparisons.';

/** Canonical base URL for absolute links, OG tags, canonical. Override via PUBLIC_SITE_URL at build/runtime if needed. */
export const SITE_URL = 'https://sona.vesta.cx';

/** Base path if the app is served under a subpath (e.g. /app). Usually "/". */
export const BASE_PATH = '/';

/** Public links */
export const LINKS = {
	github: 'https://github.com/vesta-cx/sona',
	githubOrg: 'https://github.com/vesta-cx',
	contactEmail: 'contact@mia.cx'
} as const;

/**
 * Image paths. Favicon is imported in root layout; ogImage used for social cards when set.
 * Use absoluteUrl(IMAGES.ogImage) for og:image when ogImage is non-null.
 */
export const IMAGES = {
	favicon: '/favicon.svg',
	/** OG/Twitter card image (1200×630). Run `pnpm capture-og` with dev server to generate. */
	ogImage: '/og.png'
} as const;

/** Format a page title: "Page | Sona" or "Sona — Tagline" for home */
export const pageTitle = (pageName?: string): string =>
	pageName ? `${pageName} | ${SITE_NAME}` : `${SITE_NAME} — ${TAGLINE}`;

/** Absolute URL for a path (used in og:url, canonical, etc.) */
export const absoluteUrl = (path: string): string => {
	const base = SITE_URL.replace(/\/$/, '');
	const p = path.startsWith('/') ? path : `/${path}`;
	return `${base}${p}`;
};
