<!-- @format -->

# `@vesta-cx/auth`

Shared WorkOS auth runtime for Vesta apps.

## Contract

- `createAuthRuntime(...)` builds the core auth runtime from explicit config.
- `createAuthRuntimeFromEnv(...)` builds the same runtime from `PRIVATE_WORKOS_*` env values.
- `createAuthHandle(...)` wires the runtime into SvelteKit protected-route hydration.
- `completeSvelteKitLogin(...)`, `commitSealedSession(...)`, and `clearSealedSession(...)` handle browser session cookie flows.
- `commitSealedSession(...)` and `commitOAuthState(...)` take options objects for cookie name, max age, and secure flags.
- `createVestaProvisioningAdapter(...)` maps auth sessions into app-owned Vesta provisioning store operations.
- `updateUserDetails(...)` updates WorkOS-owned legal name and sign-in email through the shared auth boundary.
- `listAuthFactors(...)`, `enrollTotpFactor(...)`, `verifyTotpEnrollment(...)`, and `deleteAuthFactor(...)` expose WorkOS TOTP management without leaking SDK calls into apps.

## Architecture

- `runtime.ts` owns the high-level auth workflows, retry policy, failure mapping, and membership/provisioning orchestration.
- `workos-transport.ts` is the concrete WorkOS transport boundary.
- `sveltekit.ts` keeps framework glue thin at the app boundary.
- `vesta-provisioning.ts` owns Vesta provisioning semantics while concrete DB writes stay in app-owned stores.

## Notes

- This package uses `@workos-inc/node` directly.
- WorkOS AuthKit passkeys are currently hosted-UI only; custom server-side factor management is limited to TOTP until WorkOS exposes passkey management APIs.
- Session cookies use the WorkOS sealed-session model rather than the legacy custom cookie payload.
- The local Effect source reference lives in `.references/effect-v4-beta/` and is for read-only implementation context only.
- The broader stack reference pack lives under `.references/` too: `workos-node`, `hono`, `sveltekit`, and `drizzle-orm`.
- Run `pnpm references` from the repo root to refresh the local-only worktrees without adding them to git.
