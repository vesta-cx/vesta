<!-- @format -->

# `@vesta-cx/auth`

Shared WorkOS auth runtime for Vesta apps.

## Contract

- `createAuthRuntime(...)` builds the core auth runtime from explicit config.
- `createAuthRuntimeFromEnv(...)` builds the same runtime from `PRIVATE_WORKOS_*` env values.
- `createAuthHandle(...)` wires the runtime into SvelteKit protected-route hydration.
- `completeSvelteKitLogin(...)`, `commitSealedSession(...)`, and `clearSealedSession(...)` handle browser session cookie flows.
- `createVestaProvisioningAdapter(...)` is the first-party adapter for local Vesta user and organization upserts.

## Architecture

- `runtime.ts` owns the high-level auth workflows, retry policy, failure mapping, and membership/provisioning orchestration.
- `workos-transport.ts` is the concrete WorkOS transport boundary.
- `sveltekit.ts` keeps framework glue thin at the app boundary.
- `vesta-provisioning.ts` keeps local DB writes out of the core auth runtime.

## Notes

- This package uses `@workos-inc/node` directly.
- Session cookies use the WorkOS sealed-session model rather than the legacy custom cookie payload.
- The local Effect source reference lives in `.references/effect-v4-beta/` and is for read-only implementation context only.
- The broader stack reference pack lives under `.references/` too: `workos-node`, `hono`, `sveltekit`, and `drizzle-orm`.
- Run `pnpm references` from the repo root to refresh the local-only worktrees without adding them to git.
