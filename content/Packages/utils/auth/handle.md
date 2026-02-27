---
title: auth/handle.ts
description: SvelteKit handle factory for session hydration and protected-route enforcement
---

# `handle.ts`

Source: `packages/utils/src/auth/handle.ts`

This file provides `createAuthHandle`, a SvelteKit hook factory that centralizes auth checks.

## Defaults

- `DEFAULT_LOGIN_PATH = '/auth/login'`
- `DEFAULT_COOKIE_NAME = 'session'`

## `createAuthHandle(config)`

```ts
createAuthHandle(config: AuthHandleConfig): Handle
```

Purpose:

- Hydrate session into `event.locals`.
- Enforce auth for configured path prefixes.
- Redirect unauthenticated users for protected routes.

Config used by current implementation:

- `protectedPaths` (required)
- `loginPath` (optional; default `/auth/login`)
- `cookieName` (optional; default `session`)

Runtime flow:

1. Read request pathname from `event.url.pathname`.
2. Attempt to read `platform.env` as `AuthEnv`.
3. If env exists:
   - Call `getSession(event.cookies, PRIVATE_WORKOS_COOKIE_PASSWORD, cookieName)`.
   - If a session is found, assign `event.locals.session`.
4. Determine if route is protected via `protectedPaths.some((p) => pathname.startsWith(p))`.
5. If protected and `locals.session` is missing:
   - Return raw `302` `Response` with `location: loginPath`.
6. Otherwise call `resolve(event)`.

## Why raw `Response` redirect

The helper intentionally returns a raw redirect `Response` (instead of SvelteKit `redirect()`) to avoid dual-instance issues when `@sveltejs/kit` resolves differently between shared package and consuming app.

## Integration pattern

Typical usage in `hooks.server.ts`:

```ts
import { createAuthHandle } from "@vesta-cx/utils/auth"

const handleAuth = createAuthHandle({
  protectedPaths: ["/admin"],
  loginPath: "/auth/login",
})
```

Then compose with other handles (`sequence()` or manual composition).
