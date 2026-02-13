import { persistentAtom } from "@nanostores/persistent";
import { ONE_WEEK, ONE_YEAR } from "../constants.js";
import { deleteCookie, getCookies, setCookie } from "./cookie.js";
import type {
	CookieAttributes,
	CookieConsent,
	SimpleCategory,
	VendorConsent,
	VendorPurpose,
} from "./types.js";

// ── Compliance attributes ────────────────────────────────────────────────────

const simpleCategoryAttributes: Record<SimpleCategory, CookieAttributes> = {
	essential: { samesite: "strict", "max-age": ONE_YEAR },
	preferences: { "max-age": ONE_YEAR },
};

const vendorPurposeAttributes: Record<VendorPurpose, CookieAttributes> = {
	analytics: { "max-age": ONE_WEEK * 4 },
	advertising: { partitioned: true, "max-age": ONE_WEEK * 4 },
};

// ── Consent key in localStorage ──────────────────────────────────────────────

const CONSENT_STORAGE_KEY = "cookie-consent";

// ── Default consent ──────────────────────────────────────────────────────────

const defaultConsent: CookieConsent = {
	essential: "true",
	preferences: "true",
	vendors: {},
};

// ── Store ────────────────────────────────────────────────────────────────────

export const consentStore = persistentAtom<CookieConsent>(
	CONSENT_STORAGE_KEY,
	defaultConsent,
	{ encode: JSON.stringify, decode: JSON.parse },
);

// ── Has the user made any consent choice? ────────────────────────────────────

/**
 * Returns `true` if the user has explicitly interacted with the consent UI.
 * Used by the dialog to decide whether to show itself.
 */
export const hasConsented = (): boolean => {
	if (typeof localStorage === "undefined") return false;
	return localStorage.getItem(CONSENT_STORAGE_KEY) !== null;
};

// ── Set a cookie for a simple category (essential / preferences) ─────────────

/**
 * Write a cookie that respects the current consent state for a simple category.
 * If the category is not consented, the cookie is deleted instead.
 */
export const setConsentCookie = (
	category: SimpleCategory,
	key: string,
	value: string,
	attributes?: CookieAttributes,
): void => {
	const consent = consentStore.get();
	const consented =
		category === "essential" ? true : consent.preferences === "true";

	if (consented) {
		setCookie(`${category}:${key}`, value, {
			...attributes,
			...simpleCategoryAttributes[category],
		});
	} else {
		deleteCookie(`${category}:${key}`);
	}
};

// ── Set a cookie scoped to a vendor + purpose ────────────────────────────────

/**
 * Write a cookie scoped to a specific vendor and purpose.
 * Checks `consent.vendors[vendor]?.[purpose]` before setting.
 * Cookie key: `{vendor}:{purpose}:{key}`.
 */
export const setVendorCookie = (
	vendor: string,
	purpose: VendorPurpose,
	key: string,
	value: string,
	attributes?: CookieAttributes,
): void => {
	const consent = consentStore.get();
	const vendorConsent = consent.vendors[vendor];
	const cookieKey = `${vendor}:${purpose}:${key}`;

	if (vendorConsent?.[purpose] === "true") {
		setCookie(cookieKey, value, {
			...attributes,
			...vendorPurposeAttributes[purpose],
		});
	} else {
		deleteCookie(cookieKey);
	}
};

// ── Apply consent (persist flags + purge revoked cookies) ────────────────────

/**
 * Persist consent choices as essential cookies (server-readable) and
 * purge cookies belonging to revoked vendors/purposes.
 */
export const applyConsent = (consent: CookieConsent): void => {
	const cookies = getCookies();

	// Persist preferences flag as an essential cookie
	setConsentCookie("essential", "consent.preferences", consent.preferences);

	// Purge preference cookies if revoked
	if (consent.preferences !== "true") {
		for (const cookieKey of Object.keys(cookies)) {
			if (cookieKey.startsWith("preferences:")) {
				deleteCookie(cookieKey);
			}
		}
	}

	// Persist per-vendor consent flags + purge revoked vendor cookies
	for (const [vendorId, vendorConsent] of Object.entries(consent.vendors)) {
		for (const purpose of ["analytics", "advertising"] as const) {
			const value = vendorConsent[purpose];

			// Store the flag as an essential cookie
			setConsentCookie(
				"essential",
				`consent.vendor.${vendorId}.${purpose}`,
				value,
			);

			// Purge cookies if this purpose was revoked
			if (value !== "true") {
				const prefix = `${vendorId}:${purpose}:`;
				for (const cookieKey of Object.keys(cookies)) {
					if (cookieKey.startsWith(prefix)) {
						deleteCookie(cookieKey);
					}
				}
			}
		}
	}
};

// ── Convenience helpers for UI "Accept All" / "Reject All" ──────────────────

/**
 * Accept all purposes for the given vendor list.
 * Also enables preferences.
 */
export const acceptAllVendors = (vendorIds: string[]): void => {
	const allTrue: VendorConsent = { analytics: "true", advertising: "true" };
	const vendors: Record<string, VendorConsent> = {};
	for (const id of vendorIds) {
		vendors[id] = { ...allTrue };
	}
	consentStore.set({ essential: "true", preferences: "true", vendors });
};

/**
 * Reject all vendor purposes. Keeps preferences enabled
 * (since they're functional, not tracking).
 */
export const rejectAllVendors = (): void => {
	const current = consentStore.get();
	const vendors: Record<string, VendorConsent> = {};
	for (const id of Object.keys(current.vendors)) {
		vendors[id] = { analytics: "false", advertising: "false" };
	}
	consentStore.set({ essential: "true", preferences: "true", vendors });
};

// Auto-apply whenever consent changes
consentStore.listen(applyConsent);
