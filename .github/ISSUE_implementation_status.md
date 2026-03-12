# Roadmap issues: implementation status (code check)

Checked the codebase for each roadmap issue. **Done** = implemented; **Partial** = some work present; **No** = not implemented.

---

## Exploration / discovery (#1–#3)

| # | Title | Status | Notes |
|---|--------|--------|------|
| 1 | Data Model | **No** | Exploratory; no single “data model” implementation to check. |
| 2 | [Data Model] Music Metadata | **No** | No music-specific metadata schema or types in db. |
| 3 | [Data Model] Generics | **No** | No generic resource/type abstraction in schema. |

---

## Infra & tooling (#36, #55–#58)

| # | Title | Status | Notes |
|---|--------|--------|------|
| 36 | Epic: Infrastructure & tooling | — | Container. |
| 55 | Flatten git tree: submodules → subtrees | **Done** | `.gittrees` present; `tools/scripts/push-subtrees.sh` exists. |
| 56 | Revisit changesets and package versioning | **Partial** | `.changeset/config.json` exists; “revisit” = decide flow, not add. |
| 57 | Extract git shell helpers into @mia-cx package | **No** | No published package or extracted helpers in repo. |
| 58 | Worker perf backlog | **No** | No shared cold-path/bundle/D1/caching implementation tracked in code. |

---

## Database schema & performance (#32, #38–#45)

| # | Title | Status | Notes |
|---|--------|--------|------|
| 32 | Epic: Database schema modernization | — | Container. |
| 38 | Schema-first alignment; db as source of truth, doc regeneration | **No** | No schema-first doc generation or single source of truth pipeline. |
| 39 | Add Drizzle-native indexes on core tables | **Partial** | Only `permissions` has `index()` in schema; `resources`, `collections`, `engagements` have none. |
| 40 | Add SQL views (public_resources_v0, public_collections_v0, etc.) | **No** | Views only in plan file; not in `packages/db` schema or migrations. |
| 41 | Migration cleanup: temporary 0004 and journal entries | **Partial** | Journal has 0000–0004; no “temporary” cleanup or duplicate 0004. |
| 42 | Audit engagement indexes from real Erato query patterns | **No** | No engagement indexes in schema; no audit artifact. |
| 43 | Implement flat-following contract | **No** | Described in plans/docs; no service/API implementation. |
| 44 | Define read/unread analytics contract | **No** | Mentioned in docs/plans; no defined contract in code or API. |
| 45 | Permissions: use static:authenticated consistently | **Partial** | Schema has `STATIC_SUBJECT_IDS` with `"authenticated"`; migration 0004 renames to `authenticated`. Docs may still say “user”. |

---

## Test coverage & quality gates (#33, #46–#48)

| # | Title | Status | Notes |
|---|--------|--------|------|
| 33 | Epic: Test coverage & quality gates | — | Container. |
| 46 | Coverage baselines and package Vitest thresholds | **Partial** | Only euterpe has numeric `thresholds` in vitest.config; erato/db/utils/clean/drizzle-query-factory have coverage config but no thresholds. |
| 47 | Targeted tests: Erato routes/auth, storage, cleanc, drizzle-query-factory | **Partial** | Erato: auth (middleware, keys, helpers), validation, errors, route-metadata, links, some services. No broad route or storage test suite. cleanc and drizzle-query-factory have tests. |
| 48 | Turbo/CI coverage gate to fail PRs on regression | **No** | `turbo.json` has no `test` or `test:coverage` task; no CI step that fails on coverage drop. |

---

## Comments & threading (#34, #49–#50)

| # | Title | Status | Notes |
|---|--------|--------|------|
| 34 | Epic: Comments & threading | — | Container. |
| 49 | Add thread fields to resources schema | **No** | No `parent_resource_id`, `rootResourceId`, or `threadDepth` in `packages/db` schema. |
| 50 | Update db model docs for status-based comments and engagement-comments | **Partial** | engagements.md describes engagement_comments; no clear “status-based comments” migration doc. |

---

## Documentation (#35, #51–#54)

| # | Title | Status | Notes |
|---|--------|--------|------|
| 35 | Epic: Documentation | — | Container. |
| 51 | Rebuild db model docs from schema (schema-first) | **No** | Docs are hand-written; no generated docs from schema. |
| 52 | Normalize collection terminology (owner vs actor) | **Partial** | collections.md uses “owner”; “actor” mentioned once for kind. Not fully normalized. |
| 53 | Document flat-following and read/unread in API docs | **Partial** | collections.md and plans describe flat-following; no dedicated API doc section. |
| 54 | Move drizzle-query-factory docs to mia-cx/docs when repo exists | **No** | Docs still under `apps/docs/content/packages/drizzle-query-factory/`. |

---

## Erato API foundation (#37, #59–#67)

| # | Title | Status | Notes |
|---|--------|--------|------|
| 37 | Epic: Erato API foundation | — | Container. |
| 59 | Erato v1 route groups and endpoint naming conventions | **Partial** | Routes exist under `/resources`, `/collections`, etc.; roadmap still lists this as TODO; no formal v1 grouping doc. |
| 60 | Standardize response envelope and error format | **Partial** | `listResponse` / `itemResponse` from drizzle-query-factory; errors via `lib/errors`. Not formally standardized/documented. |
| 61 | Pagination, filter, and sort conventions for list endpoints | **Partial** | `parseListQuery` + config used in many list routes; resources/list uses custom `paginatedQuery`. Conventions not fully documented. |
| 62 | Auth and authorization middleware per route group | **Partial** | Auth middleware and scope checks exist; not grouped per route group. |
| 63 | Document idempotency expectations for Erato write endpoints | **No** | roadmap.md lists as TODO; no idempotency doc for Erato (euterpe has it). |
| 64 | Request validation strategy and shared validators | **Partial** | `parseBody` + Zod in many create/update routes; `lib/validation.ts`; no single documented strategy. |
| 65 | API observability baseline (request IDs, structured logs, latency) | **No** | No request-ID propagation or structured observability in Erato code. |
| 66 | Publish initial Erato endpoint catalog | **No** | route-metadata.test.ts + introspect exist; no published catalog doc. |
| 67 | Design messaging API surface (DMs, groups) — deferred | **No** | Intentionally deferred. |

---

## Summary

- **Done:** #55 (git tree).
- **Partial:** #39 (indexes on permissions only), #41 (migration state), #45 (authenticated in schema), #46 (euterpe thresholds only), #47 (some tests), #50 (engagements docs), #52–#53 (terminology/docs), #56 (changesets present), #59–#62, #64 (conventions/validation exist, not fully doc’d).
- **No:** #1–#3, #38, #40, #42–#44, #48–#49, #51, #54, #57–#58, #63, #65–#67.

If you want, next step can be: close or relabel issues that are done, or turn this into a checklist in the repo (e.g. in docs or project description).
