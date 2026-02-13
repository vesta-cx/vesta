export type {
	CookieAttributes,
	CookieConfig,
	CookieConsent,
	SimpleCategory,
	UserSettings,
	VendorConsent,
	VendorDefinition,
	VendorPurpose,
} from "./types.js";

export { configureCookies } from "./config.js";
export { getCookie, getCookies, setCookie, deleteCookie } from "./cookie.js";
export {
	consentStore,
	hasConsented,
	setConsentCookie,
	setVendorCookie,
	applyConsent,
	acceptAllVendors,
	rejectAllVendors,
} from "./consent.js";
export { settingsStore, applySettings } from "./settings.js";
