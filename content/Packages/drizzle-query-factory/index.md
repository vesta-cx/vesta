---
title: "@mia-cx/drizzle-query-factory"
description: Declarative, composable query parameter parser for Drizzle ORM
created: 2026-02-27
modified: 2026-02-27
---

# @mia-cx/drizzle-query-factory

`@mia-cx/drizzle-query-factory` is a standalone npm package that converts query parameters from any web framework into typed Drizzle ORM conditions, sorting, and pagination. It lives in the monorepo at `packages/drizzle-query-factory/` as a git submodule.

## Purpose

- Turn `?status=LISTED&sort=created_at&limit=20` into `{ where, orderBy, limit, offset }` for Drizzle
- Keep route handlers thin — declare a config once, reuse across list endpoints
- Guarantee query params can never bypass authorization (composable `where` conditions, not a complete query)
- Work identically across Hono (Erato), SvelteKit (Vesta), or any framework that uses the standard Web `Request`

## Design Principles

| Principle              | What it means                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| **Schema-agnostic**    | No built-in column names — you supply your own Drizzle schema                                  |
| **Allowlist-only**     | Only declared columns/params can produce conditions; unknown params are silently ignored       |
| **Composable**         | Returns `SQL \| undefined`, not a full query — safe to `and()` with auth/visibility conditions |
| **Custom filters**     | Arbitrary SQL via `customFilters` for sub-queries, joins, complex logic                        |
| **Dialect-agnostic**   | Works with SQLite, Postgres, MySQL — uses `Column` and `SQL` from `drizzle-orm`                |
| **Framework-agnostic** | Accepts `Request`, `URL`, `URLSearchParams`, or `Record<string, string>`                       |

## Architecture

```
Request / URL / URLSearchParams / Record
  │
  ▼
resolveParams()          normalise to URLSearchParams
  │
  ▼
parseListQuery()         iterate params against config
  ├─ column filters      config.filters[key] → applyOperator(op, column, value)
  ├─ custom filters      config.customFilters[key](value) → SQL | undefined
  ├─ sorting             ?sort=key&order=asc|desc → asc(column) / desc(column)
  └─ pagination          ?limit=n&offset=n → clamped integers
  │
  ▼
ParsedListQuery          { where, orderBy, limit, offset }
  │
  ├─► Manual path:       and(authWhere, query.where) → db.select()...
  │
  └─► Execution helper:  runListQuery({ db, table, query, baseWhere })
                          runs select + optional count(*)
  │
  ▼
listResponse()           { data, meta: { total, limit, offset, has_more } }
```

## Two Usage Modes

### Parser-only (manual query)

`parseListQuery` returns SQL fragments you apply to your own Drizzle chain. This gives full control over projections, joins, and multi-table queries.

### Execution helper (`runListQuery`)

`runListQuery` takes the Drizzle DB context and runs the query for you. Best for straightforward single-table lists where the boilerplate is identical. See [run-list-query.ts](./src/run-list-query.md) for details.

| Mode | Use when |
| --- | --- |
| Parser-only | Complex joins, custom projections, multi-step auth logic |
| Execution helper | Simple single-table lists with optional baseWhere |

## Package Structure

```
packages/drizzle-query-factory/
  src/
    index.ts              barrel export
    types.ts              all exported types
    operators.ts          FilterOp → Drizzle comparison
    parse-list-query.ts   core parser function
    run-list-query.ts     execution helper (DB handoff)
    responses.ts          envelope helpers
  tests/
    operators.test.ts
    parse-list-query.test.ts
    run-list-query.test.ts
    responses.test.ts
```

## File-Level Documentation

These docs mirror the `src/` directory:

- [types.ts](./src/types.md) — QueryInput, FilterOp, ColumnFilter, CustomFilter, ListQueryConfig, ParsedListQuery, response envelopes, execution helper types
- [operators.ts](./src/operators.md) — `applyOperator` and the operator map
- [parse-list-query.ts](./src/parse-list-query.md) — `parseListQuery` core function
- [run-list-query.ts](./src/run-list-query.md) — `runListQuery` execution helper
- [responses.ts](./src/responses.md) — `listResponse`, `itemResponse` envelope helpers

## Quick Start

```typescript
import { parseListQuery, listResponse } from "@mia-cx/drizzle-query-factory"
import type { ListQueryConfig } from "@mia-cx/drizzle-query-factory"
import { eq, and, sql } from "drizzle-orm"

const config: ListQueryConfig = {
  filters: {
    status: { column: resources.status },
    title: { column: resources.title, op: "like" },
  },
  sortable: {
    created_at: resources.createdAt,
    title: resources.title,
  },
  defaultSort: { key: "created_at", dir: "desc" },
}

// Hono
const query = parseListQuery(c.req.raw, config)

// SvelteKit
const query = parseListQuery(event.url, config)

// Compose with auth
const finalWhere = and(eq(resources.status, "LISTED"), query.where)

const [rows, [{ total }]] = await Promise.all([
  db
    .select()
    .from(resources)
    .where(finalWhere)
    .orderBy(query.orderBy)
    .limit(query.limit)
    .offset(query.offset),
  db
    .select({ total: sql<number>`count(*)` })
    .from(resources)
    .where(finalWhere),
])

return listResponse(rows, total, query.limit, query.offset)
```

## How Erato Uses It

Erato defines a `ListQueryConfig` per domain (in `src/services/*.ts`), then each list route calls `parseListQuery` and composes the result with auth conditions. See [Erato API routes](../../apps/erato/api-routes.md) for the full route map.

## Install

```bash
pnpm i @mia-cx/drizzle-query-factory
# peer dependency
pnpm i drizzle-orm
```

In the Vesta monorepo, Erato consumes it as `"workspace:*"`.

## See Also

- [Erato](../../apps/erato/index.md) — Primary consumer (Hono API)
- [packages/db](../db/index.md) — Schema definitions that configs reference
- [Drizzle ORM Docs](https://orm.drizzle.team/)
