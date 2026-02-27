---
title: auth/session.ts
description: Session cookie creation, read, and clear helpers
---

# `session.ts`

Source: `packages/utils/src/auth/session.ts`

This file handles sealed cookie session lifecycle using `iron-webcrypto`.

## Defaults

- `DEFAULT_COOKIE_NAME = 'session'`
- `DEFAULT_MAX_AGE = 60 * 60 * 24` (24 hours)

## `createSession(...)`

```ts
createSession(
  cookies,
  session,
  cookiePassword,
  cookieName = 'session',
  maxAge = 86400
): Promise<void>
```

Purpose:

- Encrypt/seal an `AuthSession` payload.
- Write secure cookie to browser.

Behavior:

- Uses `Iron.seal(session, cookiePassword, Iron.defaults)`.
- Sets cookie with:
  - `path: '/'`
  - `httpOnly: true`
  - `secure: true`
  - `sameSite: 'lax'`
  - `maxAge`

## `getSession(...)`

```ts
getSession(
  cookies,
  cookiePassword,
  cookieName = 'session'
): Promise<AuthSession | null>
```

Purpose:

- Read and decrypt existing session cookie.

Behavior:

- Returns `null` if cookie is missing.
- Attempts `Iron.unseal(...)` when cookie exists.
- If unseal fails:
  - Deletes cookie (`path: '/'`) to self-heal invalid state.
  - Returns `null`.

## `clearSession(...)`

```ts
clearSession(cookies, cookieName = 'session'): void
```

Purpose:

- Remove local session cookie regardless of current validity.

Behavior:

- Calls `cookies.delete(cookieName, { path: '/' })`.
