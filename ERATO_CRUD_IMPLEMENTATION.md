<!-- @format -->

# Erato Full CRUD API — Implementation Summary

This document summarises everything built during the Erato Full CRUD API plan.
It covers a new standalone npm package, the Erato foundation layer, and 78 route
files spanning 9 API domains across all 22 tables in the Vesta DB schema.

---

## What Was Built

### 1. `@mia-cx/drizzle-query-factory` — New Package

A reusable, framework-agnostic query parameter parser for Drizzle ORM. Lives at
`packages/drizzle-query-factory/` as a git submodule.

**Design principles:** schema-agnostic, allowlist-only, composable,
dialect-agnostic (SQLite/Postgres/MySQL), framework-agnostic (accepts `Request`,
`URL`, `URLSearchParams`, or `Record<string, string>`).

#### Files created

```
packages/drizzle-query-factory/
  package.json              @mia-cx/drizzle-query-factory, peer dep drizzle-orm >=0.30.0
  tsconfig.json             extends @vesta-cx/config/typescript/tsup
  tsup.config.ts            ESM + CJS + DTS output
  vitest.config.ts
  LICENSE                   MIT
  README.md                 Install, quick start, framework examples, custom filters,
                            composing with auth, full API reference, fallback behavior
  src/
    index.ts                barrel export
    types.ts                QueryInput, FilterOp, ColumnFilter, CustomFilter,
                            ListQueryConfig, ParsedListQuery, response envelopes
    operators.ts            applyOperator — maps FilterOp to Drizzle comparisons
    parse-list-query.ts     parseListQuery — core factory function
    responses.ts            listResponse, itemResponse — standardised envelopes
  tests/
    operators.test.ts       5 tests
    parse-list-query.test.ts  27 tests (filters, custom filters, sorting, pagination, input types)
    responses.test.ts       6 tests
```

**38 tests, all passing.**

#### Key exports

| Export                                     | Purpose                                                   |
| ------------------------------------------ | --------------------------------------------------------- |
| `parseListQuery(input, config)`            | Parses query params → `{ where, orderBy, limit, offset }` |
| `listResponse(data, total, limit, offset)` | `{ data, meta: { total, limit, offset, has_more } }`      |
| `itemResponse(data)`                       | `{ data }`                                                |
| `applyOperator(op, column, value)`         | Low-level: resolves a FilterOp to Drizzle SQL             |

---

### 2. Erato Foundation (Phase 0)

Infrastructure changes to `apps/erato/` that underpin all CRUD routes.

#### New dependencies

- `@mia-cx/drizzle-query-factory: "workspace:*"` — the query factory
- `zod: "^3.24.0"` — request body validation

#### Modified files

| File                           | Change                                                                                                                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`                 | Added `@mia-cx/drizzle-query-factory` and `zod`                                                                                                                                       |
| `src/auth/types.ts`            | Expanded `SCOPES` from 5 → 19 (added users, collections, teams, engagements, permissions, features, subscriptions read/write)                                                         |
| `src/index.ts`                 | Refactored route registration: each route exports `{ route, method, path, description, auth_required, scopes }`; health registered on root (unauthenticated); CORS middleware applied |
| `src/registry.ts`              | Unchanged (already had the right shape)                                                                                                                                               |
| `src/routes/index.ts`          | Barrel exports for all 11 domain modules                                                                                                                                              |
| `src/routes/health.ts`         | Refactored to new export shape                                                                                                                                                        |
| `src/routes/introspect.ts`     | Refactored to new export shape                                                                                                                                                        |
| `src/routes/resources/list.ts` | Refactored to use parseListQuery + listResponse + new export shape                                                                                                                    |

#### New files

| File                            | Purpose                                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `src/lib/cors.ts`               | CORS middleware — allowlists `vesta.cx` + `*.vesta.cx` + env overrides; handles OPTIONS                |
| `src/lib/errors.ts`             | Multi-error envelope: `errorResponse`, `singleError`, `zodErrors`, `notFound`, `forbidden`, `conflict` |
| `src/lib/validation.ts`         | `parseBody(c, schema)` + `isResponse()` — Zod body parsing with structured error responses             |
| `src/services/base.ts`          | Shared CRUD helpers: `paginatedList`, `getById`, `insertRow`, `updateRow`, `deleteRow`                 |
| `src/services/users.ts`         | `userListConfig`, `createUserSchema`, `updateUserSchema`, `PUBLIC_USER_FIELDS`                         |
| `src/services/workspaces.ts`    | `workspaceListConfig`, schemas, `publicWorkspaceWhere`                                                 |
| `src/services/resources.ts`     | `resourceListConfig`, schemas, `listedResourceWhere`                                                   |
| `src/services/collections.ts`   | `collectionListConfig`, schemas, `publicCollectionWhere`, `isCollectionOwner`                          |
| `src/services/teams.ts`         | `teamListConfig`, schemas                                                                              |
| `src/services/engagements.ts`   | `engagementListConfig`, `createEngagementSchema`                                                       |
| `src/services/permissions.ts`   | `permissionListConfig`, `permissionActionListConfig`, schemas                                          |
| `src/services/features.ts`      | `featureListConfig`, `featurePresetListConfig`, schemas                                                |
| `src/services/subscriptions.ts` | `createSubscriptionSchema`, `updateSubscriptionSchema`, `grantUserFeatureSchema`                       |

#### New tests

| File                         | Tests                                                                                          |
| ---------------------------- | ---------------------------------------------------------------------------------------------- |
| `src/lib/errors.test.ts`     | 5 — errorResponse, singleError, notFound, forbidden, conflict                                  |
| `src/lib/cors.test.ts`       | 6 — allowed origins, subdomains, deep subdomain rejection, unknown origin, env extras, OPTIONS |
| `src/lib/validation.test.ts` | 5 — valid body, invalid JSON, validation errors, isResponse                                    |

**49 Erato tests total (33 existing + 16 new), all passing.**

---

### 3. CRUD Routes (Phases 1–3)

78 route files across 9 API domains covering all 22 DB tables. Each file exports
`{ route, method, path, description, auth_required, scopes }` for automatic
registration and introspection.

#### Route counts by domain

| Domain                 | Endpoints                             | Guest Access                     | Notes                                      |
| ---------------------- | ------------------------------------- | -------------------------------- | ------------------------------------------ |
| **Users**              | 5 (list, get, create, update, delete) | Public profiles (limited fields) | PK is WorkOS user ID                       |
| **Workspaces**         | 5                                     | Public workspaces only           | Unique slug constraint → 409               |
| **Resources**          | 5                                     | LISTED status only               | Two-layer auth (scope + permissions table) |
| — Authors              | 3 (list, add, remove)                 | Same as parent                   | Composite PK                               |
| — Post                 | 3 (get, upsert, delete)               | If resource is LISTED            | 1:1 extension via PUT upsert               |
| — URLs                 | 4 (list, add, update, remove)         | Same as parent                   | Keyed by position                          |
| **Collections**        | 5                                     | Public only                      | Owner check on write                       |
| — Items                | 3 (list, add, remove)                 | —                                | Composite PK                               |
| — Visibility           | 2 (get, update)                       | —                                | Owner-only; replace-all on PUT             |
| — Filters              | 2 (list, update)                      | —                                | Owner-only; replace-all on PUT             |
| **Engagements**        | 4 (list, get, create, delete)         | No                               | Comments/mentions inline (1:1)             |
| **Teams**              | 5                                     | No                               | Owner check on write                       |
| — Members              | 3 (list, add, remove)                 | —                                | Composite PK                               |
| **Permissions**        | 4 (list, create, update, delete)      | No                               | Non-admin sees own rows only               |
| **Permission Actions** | 5 (list, get, create, update, delete) | No                               | Admin-only for CUD                         |
| **Features**           | 5                                     | Yes (read-only catalog)          | Admin-only for CUD                         |
| — Pricing              | 2 (get, update)                       | Yes (read)                       | Upsert pattern                             |
| **Feature Presets**    | 5                                     | Yes (read)                       | Admin-only for CUD                         |
| **Subscriptions**      | 3 (get, create, update)               | No                               | Self-or-admin read                         |
| **User Features**      | 3 (list, grant, revoke)               | No                               | Self-or-admin read; admin CUD              |

**Total: ~65 endpoint handlers + 13 barrel `index.ts` files = 78 route files.**

#### Scope system (19 scopes)

```
users:read        users:write
workspaces:read   workspaces:write
resources:read    resources:write
collections:read  collections:write
teams:read        teams:write
engagements:read  engagements:write
permissions:read  permissions:write
features:read     features:write
subscriptions:read subscriptions:write
admin                                   ← bypasses all checks
```

#### Auth patterns used

| Pattern                         | Where                                                                                                    |
| ------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Guest access with filtered data | Users (public fields), workspaces (public), resources (LISTED), collections (public), features (catalog) |
| Scope check                     | Every authenticated route                                                                                |
| Admin bypass                    | Every route — `auth.scopes.includes("admin")` skips scope + row checks                                   |
| Owner check                     | Workspaces, resources, collections, teams (write/delete)                                                 |
| Self-or-admin                   | Users update, subscriptions get, user-features list                                                      |
| Row-level permissions           | Resources list/get (permissions table sub-query for non-admin)                                           |

#### Response conventions

| Verb         | Success                                              | Error                                          |
| ------------ | ---------------------------------------------------- | ---------------------------------------------- |
| GET (list)   | `{ data, meta: { total, limit, offset, has_more } }` | —                                              |
| GET (single) | `{ data }`                                           | 404 `{ error, errors }`                        |
| POST         | `{ data }` with 201                                  | 409 on unique violation; 422 on validation     |
| PUT          | `{ data }`                                           | 404 if not found; 409 on unique violation      |
| DELETE       | 204 (no body)                                        | 404 if not found                               |
| Any          | —                                                    | `{ error, errors: [{ code, message, path }] }` |

---

### 4. Documentation & Rules

| File                                                     | Purpose                                                                                                                           |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `packages/drizzle-query-factory/README.md`               | Full package docs: install, quick start, framework examples, custom filters, auth composition, API reference, fallback behavior   |
| `apps/docs/content/apps/erato/api-routes.md`             | Complete API route reference for all Erato endpoints with scopes, guest access, response envelopes, query params, and scope table |
| `.cursor/rules/erato-rules/erato-crud-route-pattern.mdc` | Cursor rule capturing the route file pattern (export shape, auth flow, query factory usage, error handling, response envelopes)   |

---

## Architecture Overview

```
Client
  │
  ▼
┌─────────────────────────────────────────┐
│ Erato Worker (Hono)                     │
│                                         │
│  CORS middleware                         │
│  ├─ /v0/health (unauthenticated)        │
│  │                                      │
│  └─ Auth middleware (KV API key lookup)  │
│     ├─ Route handler (thin)             │
│     │   ├─ parseBody (Zod validation)   │
│     │   └─ Service layer                │
│     │       ├─ Auth checks              │
│     │       ├─ parseListQuery (factory) │
│     │       ├─ Drizzle ORM (D1)        │
│     │       └─ listResponse / item      │
│     └─ routeRegistry → /introspect      │
└─────────────────────────────────────────┘
```

---

## Test Summary

| Package                         | Test Files | Tests  | Status          |
| ------------------------------- | ---------- | ------ | --------------- |
| `@mia-cx/drizzle-query-factory` | 3          | 38     | ✓               |
| `apps/erato`                    | 6          | 49     | ✓               |
| **Total**                       | **9**      | **87** | **All passing** |

---

## What's Deferred

These items were explicitly scoped out of this plan:

- **Permission actions seed data** — which actions exist per table; to be
  decided in a later plan
- **PATCH method** — reserved for future partial updates; v0 uses PUT
- **Cursor-based pagination** — can be added as a separate export in the query
  factory
- **Changesets / npm publishing** — tracked in `TODO.md` at repo root
- **Integration tests** — route-level tests with mocked D1; current tests cover
  lib modules and the query factory
