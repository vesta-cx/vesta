---
title: run-list-query.ts
description: Execution helper that runs a paginated Drizzle query from parsed query params
---

# `run-list-query.ts`

Source: `packages/drizzle-query-factory/src/run-list-query.ts`

## `runListQuery(options)`

Executes a paginated list query against a Drizzle table, composing `baseWhere` with the `where` from `parseListQuery`. Eliminates the repetitive select + count + pagination boilerplate in list route handlers.

### Signature

```typescript
// Rows mode (default)
function runListQuery<TTable extends Table>(
  opts: RunListQueryRowsOptions<TTable>,
): Promise<ListQueryResult<TTable["$inferSelect"]>>

// Envelope mode
function runListQuery<TTable extends Table>(
  opts: RunListQueryEnvelopeOptions<TTable>,
): Promise<ListResponseEnvelope<TTable["$inferSelect"]>>
```

### Parameters

| Param       | Type                   | Required | Description                                                         |
| ----------- | ---------------------- | -------- | ------------------------------------------------------------------- |
| `db`        | `{ select: SelectFn }` | Yes      | Any Drizzle database instance (D1, Postgres, MySQL, better-sqlite3) |
| `table`     | `Table`                | Yes      | The Drizzle table to select from                                    |
| `query`     | `ParsedListQuery`      | Yes      | Output of `parseListQuery`                                          |
| `baseWhere` | `SQL`                  | No       | Additional WHERE condition composed with `query.where` via `and()`  |
| `count`     | `boolean`              | No       | Run a `count(*)` query for exact total. Default: `true`             |
| `mode`      | `"rows" \| "envelope"` | No       | Return shape. Default: `"rows"`                                     |

### Return Types

#### `mode: "rows"` (default)

```typescript
type ListQueryResult<T> = {
  rows: T[]
  total: number
  has_more: boolean
}
```

The consumer wraps this in whatever response shape they need (or passes to `listResponse`).

#### `mode: "envelope"`

```typescript
type ListResponseEnvelope<T> = {
  data: T[]
  meta: { total: number; limit: number; offset: number; has_more: boolean }
}
```

Ready to return directly as JSON — no additional wrapping needed.

### Where Composition

`baseWhere` and `query.where` are combined with `and()`:

| `baseWhere` | `query.where` | Effective WHERE               |
| ----------- | ------------- | ----------------------------- |
| defined     | defined       | `and(baseWhere, query.where)` |
| defined     | `undefined`   | `baseWhere`                   |
| `undefined` | defined       | `query.where`                 |
| `undefined` | `undefined`   | `undefined` (no WHERE clause) |

### Count Behavior

#### `count: true` (default)

Runs two parallel queries:

1. `db.select().from(table).where(finalWhere).orderBy(...).limit(...).offset(...)` — rows
2. `db.select({ total: count(*) }).from(table).where(finalWhere)` — exact count

#### `count: false`

Runs a single query (rows only) and computes heuristic metadata:

- `total = offset + rows.length` (lower-bound, not exact)
- `has_more = rows.length === limit`

Useful for "load more" UIs where exact totals aren't needed.

### Examples

#### Simple table scan

```typescript
const query = parseListQuery(c.req.url, featureListConfig)

const envelope = await runListQuery({
  db,
  table: features,
  query,
  mode: "envelope",
})
return c.json(envelope)
```

#### Sub-resource with baseWhere

```typescript
const query = parseListQuery(c.req.url, collectionItemListConfig)

const envelope = await runListQuery({
  db,
  table: collectionItems,
  query,
  baseWhere: eq(collectionItems.collectionId, collectionId),
  mode: "envelope",
})
return c.json(envelope)
```

#### Rows mode with custom response

```typescript
const { rows, total, has_more } = await runListQuery({
  db,
  table: features,
  query,
})
return c.json({ features: rows, total, has_more })
```

### Caveats

- **`count: false` produces non-exact metadata.** `total` is a lower bound. `has_more` can be a false positive when `rows.length` happens to equal `limit` but there are no more rows. Document this to frontend consumers.
- **Two-query drift under concurrent writes.** When `count: true`, the rows and count queries run concurrently without a transaction. If a row is inserted or deleted between the two queries, `total` may not exactly match the rows returned. This is acceptable for pagination UI metadata and is the standard trade-off for non-transactional databases like D1.
