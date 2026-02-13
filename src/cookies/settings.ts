import { persistentMap } from "@nanostores/persistent";
import { setConsentCookie } from "./consent.js";
import type { UserSettings } from "./types.js";

const isBrowser = typeof document !== "undefined";

// ── Default settings ─────────────────────────────────────────────────────────

const defaultSettings: UserSettings = {
	theme: "auto",
	locale: "en",
	currency: "EUR",
};

// ── Store ────────────────────────────────────────────────────────────────────

export const settingsStore = persistentMap<UserSettings>(
	"settings:",
	defaultSettings,
);

// ── Apply settings to the document + persist as preference cookies ────────────

/**
 * Reflect settings onto `<html>` attributes and persist each as a
 * `preferences:settings.*` cookie.
 *
 * - `locale` → `<html lang="…">`
 * - `theme`, `motion`, `transparency`, `contrast`, `print` → `data-*` attributes
 * - `currency` → cookie only (no DOM effect)
 */
export const applySettings = (settings: UserSettings): void => {
	for (const [key, value] of Object.entries(settings)) {
		if (value === undefined) continue;

		// Reflect onto the document (skip currency — no DOM representation)
		if (isBrowser && key !== "currency") {
			switch (key) {
				case "locale":
					document.documentElement.lang = value;
					break;
				default:
					document.documentElement.dataset[key] = value;
					break;
			}
		}

		// Persist as a preference cookie
		setConsentCookie("preferences", `settings.${key}`, value);
	}
};

// Auto-apply whenever settings change
settingsStore.listen(applySettings);
