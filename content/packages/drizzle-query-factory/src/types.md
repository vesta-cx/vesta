---
title: types.ts
description: Core type definitions for @mia-cx/drizzle-query-factory
---

# `types.ts`

Source: `packages/drizzle-query-factory/src/types.ts`

All types are exported from the package barrel. This file defines the configuration, input, and output contracts.

## `QueryInput`

```typescript
type QueryInput = URLSearchParams | Request | URL | Record<string, string>
```

The polymorphic input accepted by `parseListQuery`. Internally normalised to `URLSearchParams` via `resolveParams()`.

| Type                     | Resolved via                    | Typical framework                               |
| ------------------------ | ------------------------------- | ----------------------------------------------- |
| `Request`                | `new URL(req.url).searchParams` | Hono (`c.req.raw`), SvelteKit (`event.request`) |
| `URL`                    | `.searchParams`                 | SvelteKit (`event.url`)                         |
| `URLSearchParams`        | used as-is                      | Any                                             |
| `Record<string, string>` | `new URLSearchParams(record)`   | Tests, scripts                                  |

Both Hono and SvelteKit use the standard Web `Request`, so passing it directly works without adapter code.

## `FilterOp`

```typescript
type FilterOp = "eq" | "like" | "gt" | "gte" | "lt" | "lte" | "in"
```

Comparison operators available for column filters. Each maps to a Drizzle ORM function in [operators.ts](./operators.md).

| Op     | Drizzle function       | Behavior                                 |
| ------ | ---------------------- | ---------------------------------------- |
| `eq`   | `eq(col, val)`         | Exact match (default)                    |
| `like` | `like(col, '%val%')`   | Contains search — wraps value in `%…%`   |
| `gt`   | `gt(col, val)`         | Greater than                             |
| `gte`  | `gte(col, val)`        | Greater than or equal                    |
| `lt`   | `lt(col, val)`         | Less than                                |
| `lte`  | `lte(col, val)`        | Less than or equal                       |
| `in`   | `inArray(col, [vals])` | Splits comma-separated values into array |

## `ColumnFilter`

```typescript
type ColumnFilter = {
  column: Column
  op?: FilterOp
  parse?: (value: string) => unknown
}
```

Maps a query-string parameter to a Drizzle column and operator.

- **`column`** — The Drizzle column reference (e.g. `resources.status`)
- **`op`** — Comparison operator. Defaults to `"eq"` when omitted
- **`parse`** — Optional coercion from the raw string value to the column's expected type. Called once per value, or once per comma-separated item when `op` is `"in"`. Defaults to identity (string passthrough)

Examples:

```typescript
// ?status=LISTED  →  eq(resources.status, "LISTED")
{ column: resources.status }

// ?title=hello    →  like(resources.title, "%hello%")
{ column: resources.title, op: "like" }

// ?min_age=18     →  gte(users.age, 18)
{ column: users.age, op: "gte", parse: (v) => parseInt(v, 10) }

// ?type=post,song →  inArray(resources.type, ["post", "song"])
{ column: resources.type, op: "in" }
```

## `CustomFilter`

```typescript
type CustomFilter = (value: string) => SQL | undefined
```

A consumer-defined filter that receives the raw query-param value and returns a Drizzle `SQL` condition — or `undefined` to skip. Used for logic that can't be expressed as a single column comparison: permission sub-queries, joins, composite conditions.

```typescript
// ?scope=mine → only resources owned by the current user
scope: (value) => (value === "mine" ? sql`${resources.ownerId} = ${currentUserId}` : undefined)
```

Custom filters are checked after column filters. A param that matches both a column filter key and a custom filter key will use the column filter (column takes precedence).

## `ListQueryConfig`

```typescript
type ListQueryConfig = {
  filters: Record<string, ColumnFilter>
  customFilters?: Record<string, CustomFilter>
  sortable: Record<string, Column>
  defaultSort: { key: string; dir: "asc" | "desc" }
  defaultLimit?: number
  maxLimit?: number
}
```

Declarative configuration passed to `parseListQuery`.

- **`filters`** — Query-param name → column filter. Only these param keys produce WHERE conditions
- **`customFilters`** — Optional. Param name → function returning SQL or undefined
- **`sortable`** — Allowed sort keys → Drizzle columns. Unknown `?sort=` values fall back to `defaultSort`
- **`defaultSort`** — Fallback when `sort` param is absent or invalid. `key` must exist in `sortable`
- **`defaultLimit`** — Page size when `?limit` is absent or non-numeric. Default: `20`
- **`maxLimit`** — Upper bound for `?limit`. Values above this are clamped. Default: `100`

## `ParsedListQuery`

```typescript
type ParsedListQuery = {
  where: SQL | undefined
  orderBy: SQL
  limit: number
  offset: number
}
```

The output of `parseListQuery`, ready to spread into a Drizzle query chain.

- **`where`** — AND of all matched filter conditions. `undefined` when no filters matched (Drizzle treats `undefined` as "no condition")
- **`orderBy`** — Sort expression (column + direction)
- **`limit`** — Clamped to `[1, maxLimit]`
- **`offset`** — Clamped to `>= 0`

## `ListResponseMeta`

```typescript
type ListResponseMeta = {
  total: number
  limit: number
  offset: number
  has_more: boolean
}
```

Pagination metadata included in list response envelopes. `has_more` is `true` when `offset + data.length < total`.

## `ListResponseEnvelope<T>`

```typescript
type ListResponseEnvelope<T> = {
  data: T[]
  meta: ListResponseMeta
}
```

Standardised envelope for paginated list endpoints.

## `ItemResponseEnvelope<T>`

```typescript
type ItemResponseEnvelope<T> = {
  data: T
}
```

Standardised envelope for single-item endpoints. Consistent shape with `ListResponseEnvelope` so clients can rely on `response.data` in both cases.

## `ListQueryResult<T>`

```typescript
type ListQueryResult<T> = {
  rows: T[]
  total: number
  has_more: boolean
}
```

Return type of `runListQuery` in default `"rows"` mode. Contains raw rows and pagination metadata that the consumer can wrap in any response shape.

## `RunListQueryArgs<TTable>`

```typescript
type RunListQueryArgs<TTable extends Table> = {
  db: { select: SelectFn }
  table: TTable
  query: ParsedListQuery
  baseWhere?: SQL
  count?: boolean
}
```

Base arguments shared by all `runListQuery` call signatures.

- **`db`** — Any Drizzle database instance supporting `.select().from(table)`
- **`table`** — The Drizzle table to query
- **`query`** — Output of `parseListQuery`
- **`baseWhere`** — Optional additional WHERE condition (e.g. auth scope). Composed with `query.where` via `and()`
- **`count`** — When `true` (default), runs a parallel `count(*)` for exact total. When `false`, computes heuristic metadata from returned rows

## `RunListQueryRowsOptions<TTable>`

```typescript
type RunListQueryRowsOptions<TTable extends Table> = RunListQueryArgs<TTable> & { mode?: "rows" }
```

Options for `runListQuery` when returning `ListQueryResult<T>`.

## `RunListQueryEnvelopeOptions<TTable>`

```typescript
type RunListQueryEnvelopeOptions<TTable extends Table> = RunListQueryArgs<TTable> & {
  mode: "envelope"
}
```

Options for `runListQuery` when returning `ListResponseEnvelope<T>` directly.
