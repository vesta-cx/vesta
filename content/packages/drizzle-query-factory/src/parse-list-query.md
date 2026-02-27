---
title: parse-list-query.ts
description: Core factory function that parses query parameters into Drizzle conditions
---

# `parse-list-query.ts`

Source: `packages/drizzle-query-factory/src/parse-list-query.ts`

This file contains the core `parseListQuery` function and its internal helpers.

## `parseListQuery(input, config)`

```typescript
parseListQuery(
  input: QueryInput,
  config: ListQueryConfig
): ParsedListQuery
```

Parses query parameters into a `ParsedListQuery` that can be spread directly into a Drizzle `.where()` / `.orderBy()` / `.limit()` / `.offset()` chain.

**Parameters:**

- **`input`** — Query parameters as `Request`, `URL`, `URLSearchParams`, or `Record<string, string>`
- **`config`** — Declarative filter, sort, and pagination configuration (see [types.ts](./types.md#listqueryconfig))

**Returns:** `ParsedListQuery` — `{ where, orderBy, limit, offset }`

### Processing pipeline

1. **Resolve input** → `URLSearchParams` via `resolveParams()`
2. **Iterate params** — for each `[key, value]` pair:
   - Skip reserved params (`sort`, `order`, `limit`, `offset`)
   - Skip empty values
   - Check `config.filters[key]` — if found, apply `ColumnFilter.parse` then `applyOperator`
   - Else check `config.customFilters?.[key]` — if found, call with raw value
   - Unknown keys are silently ignored
3. **AND conditions** — all matched conditions are combined with `and()`; if none matched, `where` is `undefined`
4. **Resolve sort** — `?sort=key&order=asc|desc`; invalid key or order falls back to `config.defaultSort`
5. **Resolve pagination** — `?limit=n&offset=n`; clamped to valid ranges

### Fallback behavior

The function never throws on bad input:

| Input               | Behavior                    |
| ------------------- | --------------------------- |
| Unknown param key   | Ignored                     |
| Empty param value   | Ignored                     |
| Invalid sort key    | `defaultSort.key`           |
| Invalid order value | `defaultSort.dir`           |
| Non-numeric limit   | `defaultLimit` (20)         |
| Limit > maxLimit    | Clamped to `maxLimit` (100) |
| Limit < 1           | Clamped to 1                |
| Negative offset     | Clamped to 0                |

### Framework usage

```typescript
// Hono — pass the raw Request
const query = parseListQuery(c.req.raw, config)

// SvelteKit load — pass the URL
const query = parseListQuery(event.url, config)

// SvelteKit API route — pass the Request
const query = parseListQuery(event.request, config)

// Tests — pass a plain object
const query = parseListQuery({ status: "LISTED", limit: "10" }, config)
```

### Composing with auth

The returned `where` is partial by design — it should be AND-ed with authorization conditions:

```typescript
const authWhere = isAdmin ? undefined : eq(resources.status, "LISTED")

const finalWhere = authWhere ? (query.where ? and(authWhere, query.where) : authWhere) : query.where

db.select().from(resources).where(finalWhere)
```

This guarantees query params can never widen access beyond what the auth layer allows.

### In operator

When a `ColumnFilter` has `op: "in"`, the raw value is split on commas and each segment is passed through `parse`:

```
?type=post,song  →  inArray(resources.type, ["post", "song"])
```

## `resolveParams(input)` (internal)

```typescript
resolveParams(input: QueryInput): URLSearchParams
```

Normalises any `QueryInput` variant to `URLSearchParams`.

Resolution order:

1. `URLSearchParams` → returned as-is
2. `URL` → `.searchParams`
3. `Request` → `new URL(req.url).searchParams`
4. `Record<string, string>` → `new URLSearchParams(record)`

## `parseIntClamped(raw, min, max, fallback)` (internal)

```typescript
parseIntClamped(
  raw: string | null,
  min: number,
  max: number,
  fallback: number
): number
```

Parses a string to an integer, clamping the result to `[min, max]`. Returns `fallback` when the input is `null` or not a valid integer.

Used for `limit` and `offset` parsing.

## Constants

| Constant          | Value                        | Purpose                           |
| ----------------- | ---------------------------- | --------------------------------- |
| `DEFAULT_LIMIT`   | `20`                         | Page size when `?limit` is absent |
| `MAX_LIMIT`       | `100`                        | Upper bound for `?limit`          |
| `RESERVED_PARAMS` | `sort, order, limit, offset` | Skipped during filter iteration   |
