# Cookie Stores API (`@vesta-cx/utils/cookies`)

## Store APIs

- **`consentStore`** — `persistentAtom<CookieConsent>` with JSON encode/decode.
- **`setConsentCookie(category, key, value)`** — for `essential` / `preferences` categories.
- **`setVendorCookie(vendor, purpose, key, value)`** — checks `vendors[vendor]?.[purpose]` before setting. Cookie key: `{vendor}:{purpose}:{key}`.
- **`acceptAllVendors(ids)` / `rejectAllVendors()`** — bulk helpers for UI.
- **`hasConsented()`** — checks if localStorage key exists (dialog visibility).

## UI Components

- **`CookieConsentForm`** — Full form with vendor toggles. Uses `@container` queries to adapt between narrow (dialog) and wide (page) layouts.
- **`CookieConsentDialog`** — Bottom-right sticky card. Compact → Expanded → Hidden. No overlay/backdrop.

## Gotchas

- `deleteCookie` uses `max-age=0` (not `expires` in the past) for broader compat.
- Browser-only module — guarded with `typeof document !== "undefined"`.
- `CookieConsent` no longer has an index signature — `persistentAtom` handles nested objects via JSON.
