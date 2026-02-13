// @vitest-environment happy-dom

import { describe, it, expect, beforeEach } from "vitest";
import {
	getCookie,
	getCookies,
	setCookie,
	deleteCookie,
	configureCookies,
	consentStore,
	hasConsented,
	setConsentCookie,
	setVendorCookie,
	applyConsent,
	acceptAllVendors,
	rejectAllVendors,
	settingsStore,
	applySettings,
} from "../../src/cookies/index.js";
import type { CookieConsent } from "../../src/cookies/index.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

const clearAllCookies = (): void => {
	for (const key of Object.keys(getCookies())) {
		document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
	}
};

const defaultConsent: CookieConsent = {
	essential: "true",
	preferences: "true",
	vendors: {},
};

// ── Low-level cookie helpers ─────────────────────────────────────────────────

describe("cookie CRUD", () => {
	beforeEach(() => {
		clearAllCookies();
		configureCookies({});
	});

	it("should set and get a cookie", () => {
		setCookie("test-key", "test-value");
		expect(getCookie("test-key")).toBe("test-value");
	});

	it("should return undefined for missing cookie", () => {
		expect(getCookie("nonexistent")).toBeUndefined();
	});

	it("should delete a cookie", () => {
		setCookie("to-delete", "value");
		expect(getCookie("to-delete")).toBe("value");
		deleteCookie("to-delete");
		// Real browsers remove the cookie entirely; happy-dom leaves empty string
		expect(getCookie("to-delete") || undefined).toBeUndefined();
	});

	it("should list all cookies", () => {
		setCookie("a", "1");
		setCookie("b", "2");
		const all = getCookies();
		expect(all["a"]).toBe("1");
		expect(all["b"]).toBe("2");
	});

	it("should encode and decode special characters", () => {
		setCookie("special", "hello world & more=stuff");
		expect(getCookie("special")).toBe("hello world & more=stuff");
	});

	it("should store domain config via configureCookies", () => {
		configureCookies({ domain: ".vesta.cx" });
		// happy-dom runs as localhost so domain mismatch — just verify no throw
		expect(() => setCookie("domain-test", "value")).not.toThrow();
	});
});

// ── Cookie consent (vendor model) ────────────────────────────────────────────

describe("cookie consent", () => {
	beforeEach(() => {
		clearAllCookies();
		configureCookies({});
		localStorage.clear();
		consentStore.set({ ...defaultConsent });
	});

	it("should set a cookie for a consented simple category", () => {
		setConsentCookie("preferences", "color", "blue");
		expect(getCookie("preferences:color")).toBe("blue");
	});

	it("should delete a preference cookie when preferences is revoked", () => {
		setConsentCookie("preferences", "color", "blue");
		expect(getCookie("preferences:color")).toBe("blue");

		consentStore.set({ ...defaultConsent, preferences: "false" });
		setConsentCookie("preferences", "color", "blue");
		expect(getCookie("preferences:color") || undefined).toBeUndefined();
	});

	it("should always allow essential cookies", () => {
		setConsentCookie("essential", "session-flag", "active");
		expect(getCookie("essential:session-flag")).toBe("active");
	});

	it("should set a vendor cookie when vendor purpose is consented", () => {
		consentStore.set({
			...defaultConsent,
			vendors: { google: { analytics: "true", advertising: "false" } },
		});

		setVendorCookie("google", "analytics", "ga-id", "UA-123");
		expect(getCookie("google:analytics:ga-id")).toBe("UA-123");
	});

	it("should not set a vendor cookie when purpose is not consented", () => {
		consentStore.set({
			...defaultConsent,
			vendors: { google: { analytics: "true", advertising: "false" } },
		});

		setVendorCookie("google", "advertising", "ad-id", "AD-456");
		expect(getCookie("google:advertising:ad-id") || undefined).toBeUndefined();
	});

	it("should not set a vendor cookie when vendor is unknown", () => {
		consentStore.set({ ...defaultConsent, vendors: {} });

		setVendorCookie("unknown", "analytics", "id", "123");
		expect(getCookie("unknown:analytics:id") || undefined).toBeUndefined();
	});

	it("should purge vendor cookies when consent is revoked via applyConsent", () => {
		// Set up with consent
		consentStore.set({
			...defaultConsent,
			vendors: { google: { analytics: "true", advertising: "true" } },
		});
		setVendorCookie("google", "analytics", "ga-id", "UA-123");
		setVendorCookie("google", "advertising", "ad-id", "AD-456");
		expect(getCookie("google:analytics:ga-id")).toBe("UA-123");
		expect(getCookie("google:advertising:ad-id")).toBe("AD-456");

		// Revoke analytics
		applyConsent({
			...defaultConsent,
			vendors: { google: { analytics: "false", advertising: "true" } },
		});

		expect(getCookie("google:analytics:ga-id") || undefined).toBeUndefined();
		expect(getCookie("google:advertising:ad-id")).toBe("AD-456");
	});

	it("should purge preference cookies when preferences is revoked", () => {
		setConsentCookie("preferences", "setting", "val");
		expect(getCookie("preferences:setting")).toBe("val");

		applyConsent({
			...defaultConsent,
			preferences: "false",
		});

		expect(getCookie("preferences:setting") || undefined).toBeUndefined();
	});
});

// ── Convenience helpers ──────────────────────────────────────────────────────

describe("convenience helpers", () => {
	beforeEach(() => {
		clearAllCookies();
		localStorage.clear();
		consentStore.set({ ...defaultConsent });
	});

	it("acceptAllVendors should enable all purposes for given vendors", () => {
		acceptAllVendors(["google", "cloudflare"]);
		const consent = consentStore.get();

		expect(consent.vendors["google"]?.analytics).toBe("true");
		expect(consent.vendors["google"]?.advertising).toBe("true");
		expect(consent.vendors["cloudflare"]?.analytics).toBe("true");
		expect(consent.vendors["cloudflare"]?.advertising).toBe("true");
		expect(consent.preferences).toBe("true");
	});

	it("rejectAllVendors should disable all purposes", () => {
		acceptAllVendors(["google", "meta"]);
		rejectAllVendors();
		const consent = consentStore.get();

		expect(consent.vendors["google"]?.analytics).toBe("false");
		expect(consent.vendors["google"]?.advertising).toBe("false");
		expect(consent.vendors["meta"]?.analytics).toBe("false");
		expect(consent.vendors["meta"]?.advertising).toBe("false");
		// Preferences should remain enabled
		expect(consent.preferences).toBe("true");
	});

	it("hasConsented should return false before any interaction", () => {
		localStorage.clear();
		expect(hasConsented()).toBe(false);
	});

	it("hasConsented should return true after store is written", () => {
		consentStore.set({ ...defaultConsent });
		expect(hasConsented()).toBe(true);
	});
});

// ── Settings store ───────────────────────────────────────────────────────────

describe("settings", () => {
	beforeEach(() => {
		clearAllCookies();
		configureCookies({});
		localStorage.clear();
		consentStore.set({ ...defaultConsent });
		settingsStore.set({
			theme: "auto",
			locale: "en",
			currency: "EUR",
		});
	});

	it("should apply theme to data-theme attribute", () => {
		applySettings({ theme: "dark", locale: "en", currency: "EUR" });
		expect(document.documentElement.dataset["theme"]).toBe("dark");
	});

	it("should apply locale to html lang", () => {
		applySettings({ theme: "auto", locale: "nl", currency: "EUR" });
		expect(document.documentElement.lang).toBe("nl");
	});

	it("should persist settings as preference cookies", () => {
		applySettings({ theme: "light", locale: "en", currency: "EUR" });
		expect(getCookie("preferences:settings.theme")).toBe("light");
		expect(getCookie("preferences:settings.locale")).toBe("en");
		expect(getCookie("preferences:settings.currency")).toBe("EUR");
	});

	it("should not set DOM attribute for currency", () => {
		applySettings({ theme: "auto", locale: "en", currency: "USD" });
		expect(document.documentElement.dataset["currency"]).toBeUndefined();
	});
});
