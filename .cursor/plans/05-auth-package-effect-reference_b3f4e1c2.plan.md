---
name: auth-package-effect-reference
overview: "Create a reproducible local Effect v4 beta reference checkout for agent-assisted implementation, then introduce `@vesta-cx/auth` as the dedicated home for WorkOS auth flows, Effect-based retry/orchestration, and local Vesta identity provisioning hooks."
# GitHub issues: #157 Effect reference checkout, #158 @vesta-cx/auth package.
todos:
  - id: effect-reference
    content: Add a reproducible local Effect v4 beta reference checkout workflow, pin the revision, and document how agents should use it as read-only implementation context.
    status: pending
  - id: auth-package
    content: Scaffold `@vesta-cx/auth` with explicit package exports, build config, and a migration-friendly public API.
    status: pending
  - id: dual-transports
    content: Split WorkOS integration into Cloudflare-safe REST transport and Node-only SDK transport behind shared Effect workflows.
    status: pending
  - id: provisioning
    content: Define local provisioning adapters/hooks for upserting user and organization records after sign-up/sign-in without hard-coupling the core auth runtime to one app database context.
    status: pending
  - id: migration
    content: Move consumers toward `@vesta-cx/auth` with a temporary compatibility shim from `@vesta-cx/utils/auth`, then prove the package in one app before wider rollout.
    status: pending
  - id: rules-skills-standing
    content: "Capture Knowledge — Required: update rules/docs if auth ownership moves from `@vesta-cx/utils/auth` to `@vesta-cx/auth`, so future agents stop following the old package boundary."
    status: pending
  - id: docs-standing
    content: "Documentation — Required: document the Effect reference workflow, the new auth package surface, transport/runtime boundaries, and the provisioning contract."
    status: pending
  - id: review-close-standing
    content: "Review & close — Required: verify the runtime split (Workers vs Node), migration path, retry semantics, and local provisioning contract before implementation starts."
    status: pending
isProject: false
---

<!-- @format -->

# Effect Reference + `@vesta-cx/auth`

## Best-Fit Model

- Use a more capable reasoning model for the first implementation pass because the package boundary, runtime split, and provisioning contract all need architecture-quality decisions.
- After the package/API shape is locked, a faster model is fine for follow-up file moves and consumer migrations.

## Current State

- Shared auth currently lives in `packages/utils/src/auth` and is imported as `@vesta-cx/utils/auth`.
- That package is Cloudflare-oriented today: REST calls to WorkOS, sealed cookie sessions, and SvelteKit hook wiring.
- Erato already has separate WorkOS service code plus local D1 extension logic for users and organizations.
- The repo does not currently use `Effect`, and there is no local reference checkout for agents to consult.

## Locked Decisions

- Keep **Cloudflare-safe auth flows** as a first-class path. Do not replace them with the official AuthKit SvelteKit SDK in Worker runtimes.
- Add the official **Node WorkOS SDK** only behind a **Node-only entrypoint** in `@vesta-cx/auth`; do not leak Node-only assumptions into Worker consumers.
- Put **workflow orchestration, retry policy, and typed failure handling** in `Effect`, but keep framework glue thin at app boundaries.
- Keep the core auth runtime **decoupled from a specific database implementation** by using provisioning adapters/callbacks; provide a Vesta-local adapter module rather than hard-wiring DB writes into the core transport layer.
- Migrate via a **compatibility shim** from `@vesta-cx/utils/auth` first so apps can move incrementally.
- Treat the Effect reference checkout as **local-only, read-only tooling context**, not as a vendored production dependency.

## Scope

### Track 1: Effect v4 beta reference checkout (#157)

1. Add a reproducible setup script that prepares a local Effect reference checkout in a gitignored path such as `.references/effect-v4-beta/`.
2. Add the chosen reference path to `.gitignore` and store checked-in metadata for the pinned upstream repo URL and revision so the checkout can be recreated deterministically.
3. Document that agents should read from the reference checkout for API patterns/examples only, and should not import code from it into Vesta.
4. Optionally wire the setup into `.cursor/worktrees.json` or an adjacent repo-local setup command so new worktrees can hydrate the reference with one command.

### Track 2: `@vesta-cx/auth` package (#158)

1. Create `packages/auth` with TypeScript build config, package exports, README, and tests.
2. Add `Effect` v4 beta plus the minimum supporting packages needed for retries, typed errors, and environment/runtime services.
3. Add a **Workers transport** for WorkOS REST endpoints:
   - auth code exchange
   - logout URL/session helpers
   - any Cloudflare-safe session or token refresh operations
4. Add a **Node transport** using the official WorkOS SDK for server-side/local tooling paths that benefit from the SDK.
5. Define shared Effect workflows around those transports:
   - sign-up / sign-in exchange
   - retry policy with explicit non-retryable vs retryable WorkOS failures
   - structured auth errors that apps can map to HTTP/UI outcomes
6. Define provisioning adapter contracts:
   - `ensureUser(...)`
   - `ensureOrganization(...)`
   - optional post-auth hook for membership/bootstrap side effects
7. Add a Vesta-local adapter module that can upsert local user/organization rows after sign-up/sign-in using existing DB patterns.
8. Keep `@vesta-cx/utils/auth` as a temporary re-export/shim layer while consumers move.
9. Migrate one app first as the proving integration before wider adoption:
   - prefer `apps/sona` if it remains the primary browser AuthKit consumer
   - otherwise use the first app that owns both sign-in and local profile bootstrap

## Proposed Package Shape

- `@vesta-cx/auth`
  - `./workers` — Cloudflare-safe WorkOS REST client + Effect programs
  - `./node` — Node-only WorkOS SDK client + Effect programs
  - `./session` — session/cookie helpers that stay runtime-safe for the target environment
  - `./provisioning` — adapter interfaces and shared orchestration
  - `./vesta-db` — optional Vesta-specific adapter that knows how to upsert local user/org records

## Sequencing

1. Land the Effect reference workflow first so implementation has a stable source of examples.
2. Scaffold `@vesta-cx/auth` and move shared types/contracts before moving behavior.
3. Add transports and Effect workflows next, with retries and typed errors before consumer migration.
4. Add provisioning adapters once the workflow inputs/outputs are stable.
5. Add the compatibility shim from `@vesta-cx/utils/auth`.
6. Migrate one consumer app and validate the end-to-end auth path.
7. Expand migration only after the first app proves the contract.

## Non-Goals

- Full migration of every app in the first implementation slice.
- Reworking permissions, feature gating, or unrelated session UX in the same pass.
- Replacing local domain ownership of profile extension fields; WorkOS remains the source of truth for canonical identity fields.

## Validation

- `packages/auth` builds cleanly and has focused tests for retry policy, error mapping, and provisioning orchestration.
- The chosen consumer app can sign in/sign up using the new package and still create or upsert the expected local user/org rows.
- Worker consumers do not import Node-only code paths.
- The compatibility shim preserves current imports long enough for incremental migration.
- Docs/rules are updated so agents stop treating `@vesta-cx/utils/auth` as the permanent home for auth logic, including the current WorkOS rule and the stale auth package docs.

## Risks To Watch

- Mixing Worker and Node runtime assumptions in one export surface.
- Letting the provisioning logic couple the auth package too tightly to one app’s DB context.
- Pulling too much app-specific session glue into the shared package before the core contract stabilizes.
- Treating the Effect reference checkout like vendored source instead of pinned implementation reference.
