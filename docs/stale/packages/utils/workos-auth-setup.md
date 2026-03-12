# WorkOS Auth Setup

## Shared Auth Package (`@vesta-cx/utils/auth`)

- **`createAuthHandle(config)`** — SvelteKit `Handle` factory. Hydrates `event.locals.session` on every request, enforces auth on `protectedPaths`. Compose via `sequence()`.
- **`createSession`, `getSession`, `clearSession`** — iron-webcrypto sealed cookie management.
- **`getAuthorizationUrl`, `authenticateWithCode`** — WorkOS User Management REST API helpers.
- **Types**: `AuthSession`, `AuthResult`, `AuthHandleConfig`, `AuthEnv`.

## Per-App Setup

1. Add `@vesta-cx/utils` as a workspace dependency.
2. In `hooks.server.ts`: `createAuthHandle({ protectedPaths: ['/admin'] })`, compose with `sequence()`.
3. In `app.d.ts`: type `App.Locals` with `session: AuthSession | null`.
4. Auth routes (`/auth/login`, `/auth/callback`, `/auth/logout`) stay in each app — import helpers from the shared package.
5. Protected layouts read `locals.session` (already hydrated by the handle).

## Env Vars (same across all apps)

`PRIVATE_WORKOS_CLIENT_ID`, `PRIVATE_WORKOS_API_KEY`, `PRIVATE_WORKOS_ORG_ID`, `PRIVATE_WORKOS_COOKIE_PASSWORD`
