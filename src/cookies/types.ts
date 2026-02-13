import type { Boolstring } from "../constants.js";

export interface CookieAttributes {
	domain?: string;
	expires?: Date;
	"max-age"?: number;
	partitioned?: boolean;
	path?: string;
	samesite?: "strict" | "lax" | "none";
	secure?: boolean;
}

// ── Consent types ────────────────────────────────────────────────────────────

export type VendorPurpose = "analytics" | "advertising";

export interface VendorConsent {
	analytics: Boolstring;
	advertising: Boolstring;
}

/** Top-level consent categories (always simple on/off). */
export type SimpleCategory = "essential" | "preferences";

/**
 * Cookie consent state.
 * `essential` is always `"true"`. `preferences` is a simple toggle.
 * Per-vendor consent lives in `vendors`.
 */
export interface CookieConsent {
	essential: "true";
	preferences: Boolstring;
	vendors: Record<string, VendorConsent>;
}

/**
 * Vendor metadata — passed by the app to UI components.
 * The data layer doesn't prescribe which vendors exist; apps define them.
 */
export interface VendorDefinition {
	/** Store key, e.g. `"google"`. */
	id: string;
	/** Display name, e.g. `"Google Analytics"`. */
	name: string;
	description?: string;
	privacyUrl?: string;
}

// ── Settings types ───────────────────────────────────────────────────────────

export interface UserSettings {
	[key: string]: string | undefined;
	theme: "auto" | "light" | "dark";
	print?: Boolstring;
	motion?: "reduced";
	transparency?: "reduced";
	contrast?: "more" | "less";
	locale: string;
	currency?: string;
}

/** Global cookie configuration, set once per app via `configureCookies()`. */
export interface CookieConfig {
	/** Cookie domain for cross-subdomain sharing (e.g. `.vesta.cx`). */
	domain?: string;
}
