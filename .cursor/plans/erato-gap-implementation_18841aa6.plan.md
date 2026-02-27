---
name: erato-gap-implementation
overview: "Implement the audited Erato gaps using a WorkOS-first hybrid model: add organizations endpoints backed by WorkOS + local extensions, add GET /permissions/:id, add engagements update, and add GET /me. Include tests and docs updates for each new/changed surface."
todos:
  - id: schema-org
    content: "Schemas (`packages/db`): add organizations extension table (WorkOS-id keyed) with minimal local fields (`avatarUrl`, optional `bannerUrl`, optional `themeConfig`) and align migrations."
    status: pending
  - id: service-org-hybrid
    content: "Implementation (`apps/erato`): implement WorkOS-first organizations adapter/service with field ownership split, flattened merged responses, and retry-safe error handling on partial write failures."
    status: pending
  - id: routes-org
    content: Add organizations route set (list/get/create/update/delete) and register in route index/registry.
    status: pending
  - id: route-permissions-get
    content: Add `GET /permissions/:id` route and register it.
    status: pending
  - id: route-engagements-update
    content: Add engagements update route and register it with explicit mutable fields.
    status: pending
  - id: route-me
    content: Add `GET /me` endpoint resolving subject object across user/workspace/organization sources.
    status: pending
  - id: route-introspect-admin
    content: Enforce `admin` scope in `/introspect/routes` handler (not metadata-only) since it is a protected debugging endpoint.
    status: pending
  - id: tests
    content: "Tests (vitest-writer): add and pass tests for organizations hybrid service/routes, permissions get, engagements update, and /me; then run `pnpm --filter erato test` + `pnpm --filter erato build`."
    status: pending
  - id: rules-skills
    content: "Rules & skills: capture any new WorkOS-hybrid ownership/merge convention in `.cursor/rules/` if a non-obvious pattern emerges during implementation; otherwise mark N/A with reason in final check."
    status: pending
  - id: documentation
    content: "Documentation: update `apps/docs` + `apps/erato/README.md` for hybrid organizations model, `avatarUrl` naming consistency, `/me`, permissions get, and engagements update."
    status: pending
  - id: review-close
    content: "Review & close (verifier): audit auth/scope enforcement, route metadata registration, failure modes, and simplification opportunities before finalizing."
    status: pending
isProject: false
---

<!-- @format -->

# Implement Erato Gap Set (WorkOS-First Hybrid)

## Scope

Implement the selected gaps:

- Organizations endpoints with **WorkOS as source of truth** + local D1 extension storage.
- `GET /permissions/:id`.
- Engagement update endpoint for CRUD parity.
- `GET /me` identity endpoint that resolves subject object by API key `subjectType`/`subjectId`.
- Tests and docs updates for all of the above.

## Architecture Decisions

- **Organizations:** WorkOS owns canonical org fields; Erato D1 stores Vesta-specific extension fields.
- **Users/Organizations hybrid behavior:** read returns a **flattened merged object** (no identity/extension split exposed to clients), writes fan out by field ownership.
- `**/me` behavior:\*\* authenticated endpoint; resolves `subjectType` + `subjectId`; returns merged entity when resolvable (user/workspace/org) and explicit not-found/error contract when source entity is missing.
- **Branding field naming:** standardize on `avatarUrl` (not `logoUrl`) for consistency with users/workspaces; allow optional `bannerUrl`.
- **Branding storage shape (this phase):** keep branding in entity-specific tables (`users`, `workspaces`, `organizations` extension) and defer any shared branding/theming table.
- **Commercial/billing extension fields:** explicitly out of scope for now.
- **WorkOS configuration:** use Worker env vars/secrets (Wrangler `vars` / secrets), not bindings.
- **Write routing and updated-at semantics:** only call the domain(s) that own changed fields (WorkOS and/or local). Do not touch both domains just to sync timestamps. If either called domain fails, return an error and require client retry.
- **List/query semantics:** WorkOS is SoT for users/organizations lists. Fetch ids/objects from WorkOS first, then hydrate local extension rows by id. `runListQuery` is for Drizzle/local DB only.
- **HTTP status semantics:** `401` missing/invalid API key, `403` insufficient scope/permission, `404` resource not found (across all endpoints).

## Implementation Plan

### 1) Add organization extension model (local D1)

- Add schema file and exports:
  - `[/Users/mia/vesta-cx/vesta/packages/db/src/schema/organizations.ts](/Users/mia/vesta-cx/vesta/packages/db/src/schema/organizations.ts)`
  - Update `[/Users/mia/vesta-cx/vesta/packages/db/src/schema/index.ts](/Users/mia/vesta-cx/vesta/packages/db/src/schema/index.ts)`
- Include only local extension fields (not WorkOS canonical fields), keyed by WorkOS org id.
- Initial local extension fields for this plan:
  - `workosOrgId` (PK / reference key)
  - `avatarUrl` (optional)
  - `bannerUrl` (optional)
  - `themeConfig` JSON (optional placeholder for later theming work)
- Do **not** add `logoUrl` or commercial/billing fields in this iteration.
- Add/adjust migration in `packages/db/drizzle` using existing db workflow patterns from `apps/sona`.

### 2) Add WorkOS adapter/service layer in Erato

- Reuse existing project patterns (prefer shared utilities if present; otherwise add Erato-local adapter):
  - `[/Users/mia/vesta-cx/vesta/apps/erato/src/services/organizations.ts](/Users/mia/vesta-cx/vesta/apps/erato/src/services/organizations.ts)`
  - `[/Users/mia/vesta-cx/vesta/apps/erato/src/env.ts](/Users/mia/vesta-cx/vesta/apps/erato/src/env.ts)`
- Add WorkOS env/secrets typing + runtime expectations in Erato config/env surface.
- Define ownership mapping:
  - WorkOS-owned fields (identity, naming, domain/membership-facing fields)
  - D1-owned fields (Vesta extension/configuration)
- Implement read/write merge helpers with deterministic conflict handling.
- Ensure merged responses are flattened so clients cannot distinguish source domain.
- Ensure writes touch only changed-domain targets; if any touched target fails, return error (no silent partial success response).

### 3) Add organizations routes (hybrid)

- Add route module set:
  - `[/Users/mia/vesta-cx/vesta/apps/erato/src/routes/organizations/index.ts](/Users/mia/vesta-cx/vesta/apps/erato/src/routes/organizations/index.ts)`
  - `list.ts`, `get.ts`, `create.ts`, `update.ts`, `delete.ts` under same folder
- Register in route barrel:
  - `[/Users/mia/vesta-cx/vesta/apps/erato/src/routes/index.ts](/Users/mia/vesta-cx/vesta/apps/erato/src/routes/index.ts)`
- Apply existing route metadata export shape and scope conventions; ensure `routeRegistry` reflects these endpoints.
- Add `organizations:read` / `organizations:write` scopes to auth scope set and enforce them in handlers.
- Keep list/search/sort source in WorkOS; hydrate local extension fields by returned ids.
- Do not use `runListQuery` for WorkOS list APIs; only use it for local Drizzle-backed lists.

### 4) Add `GET /permissions/:id`

- Add:
  - `[/Users/mia/vesta-cx/vesta/apps/erato/src/routes/permissions/get.ts](/Users/mia/vesta-cx/vesta/apps/erato/src/routes/permissions/get.ts)`
- Wire into:
  - `[/Users/mia/vesta-cx/vesta/apps/erato/src/routes/permissions/index.ts](/Users/mia/vesta-cx/vesta/apps/erato/src/routes/permissions/index.ts)`
- Reuse existing permission read auth/scope semantics from list/update/delete.

### 5) Add engagements update endpoint

- Add:
  - `[/Users/mia/vesta-cx/vesta/apps/erato/src/routes/engagements/update.ts](/Users/mia/vesta-cx/vesta/apps/erato/src/routes/engagements/update.ts)`
- Wire into:
  - `[/Users/mia/vesta-cx/vesta/apps/erato/src/routes/engagements/index.ts](/Users/mia/vesta-cx/vesta/apps/erato/src/routes/engagements/index.ts)`
- Define allowed mutable fields and constraints (avoid unsafe identity mutation unless explicitly intended).

### 6) Add `GET /me`

- Add:
  - `[/Users/mia/vesta-cx/vesta/apps/erato/src/routes/me.ts](/Users/mia/vesta-cx/vesta/apps/erato/src/routes/me.ts)`
- Register in:
  - `[/Users/mia/vesta-cx/vesta/apps/erato/src/routes/index.ts](/Users/mia/vesta-cx/vesta/apps/erato/src/routes/index.ts)`
- Behavior:
  - Require authenticated API key.
  - Resolve by `subjectType`:
    - `user` -> WorkOS user + local user extensions
    - `organization` -> WorkOS org + local org extensions
    - `workspace` -> local workspace row
  - Return flattened `subject` object.
  - Return `404` when subject is not found, `401` for invalid/missing key, `403` when scope/permission is insufficient.

### 7) Enforce admin on introspection route

- Update:
  - `[/Users/mia/vesta-cx/vesta/apps/erato/src/routes/introspect.ts](/Users/mia/vesta-cx/vesta/apps/erato/src/routes/introspect.ts)`
- Add explicit `requireScope(auth, "admin")` enforcement in handler.

### 8) Tests + verification

- Add/update route + service tests:
  - organizations hybrid service tests (WorkOS mocked + D1/local extension behavior)
  - `permissions/get` route tests
  - engagements update route tests
  - `/me` route tests (each `subjectType`, auth failures, not-found)
  - `/introspect/routes` admin enforcement tests (non-admin forbidden, admin allowed)
- Run:
  - `pnpm --filter erato test`
  - `pnpm --filter erato build`

### 9) Documentation updates

- Update endpoint docs and usage notes in:
  - `[/Users/mia/vesta-cx/vesta/apps/erato/README.md](/Users/mia/vesta-cx/vesta/apps/erato/README.md)`
  - `[/Users/mia/vesta-cx/vesta/apps/docs/content/packages/db/model/identity/organizations.md](/Users/mia/vesta-cx/vesta/apps/docs/content/packages/db/model/identity/organizations.md)`
  - `[/Users/mia/vesta-cx/vesta/apps/docs/content/packages/db/model/identity/users.md](/Users/mia/vesta-cx/vesta/apps/docs/content/packages/db/model/identity/users.md)`
  - `[/Users/mia/vesta-cx/vesta/apps/docs/content/packages/db/model/identity/workspaces.md](/Users/mia/vesta-cx/vesta/apps/docs/content/packages/db/model/identity/workspaces.md)`
  - Relevant `apps/docs/content/...` API pages for `/organizations`, `/permissions/:id`, `/engagements/:id` update, and `/me`.
- Add Erato app docs in `apps/docs` as a REST API reference with endpoint lists plus example request/response payloads.
- Add short note in root TODO only if anything is intentionally deferred.

## Risks and mitigations

- **Dual-write consistency (WorkOS + D1):** only call changed domains; on any called-domain failure, return explicit error and include recovery guidance/log correlation.
- **Scope drift for new endpoints:** mirror existing scope naming conventions (`*:read` / `*:write`) and enforce in route handlers.
- **Type drift across auth context changes:** keep `subjectType`/`subjectId` as the only identity fields in auth context and tests.
