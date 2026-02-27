---
title: responses.ts
description: Standardised response envelope helpers
---

# `responses.ts`

Source: `packages/drizzle-query-factory/src/responses.ts`

Provides two helpers for wrapping query results in standardised JSON envelopes. These are optional — the package's core value is `parseListQuery` — but they enforce a consistent shape that clients can rely on.

## `listResponse(data, total, limit, offset)`

```typescript
listResponse<T>(
  data: T[],
  total: number,
  limit: number,
  offset: number
): ListResponseEnvelope<T>
```

Wraps a page of results with pagination metadata.

**Parameters:**

- **`data`** — The rows for the current page
- **`total`** — Total count of matching rows (from a separate `count(*)` query)
- **`limit`** — Page size (from `ParsedListQuery.limit`)
- **`offset`** — Current offset (from `ParsedListQuery.offset`)

**Returns:**

```json
{
  "data": [...],
  "meta": {
    "total": 42,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

`has_more` is computed as `offset + data.length < total`. This tells the client whether there are more pages to fetch without requiring them to calculate it.

**Examples:**

```typescript
// First page, more results exist
listResponse([1, 2, 3], 10, 3, 0)
// → meta.has_more = true  (0 + 3 < 10)

// Last page
listResponse([8, 9, 10], 10, 3, 7)
// → meta.has_more = false  (7 + 3 >= 10)

// Empty result
listResponse([], 0, 20, 0)
// → meta.has_more = false
```

## `itemResponse(data)`

```typescript
itemResponse<T>(data: T): ItemResponseEnvelope<T>
```

Wraps a single item in a `{ data }` envelope.

**Parameters:**

- **`data`** — The item to wrap

**Returns:**

```json
{
  "data": { "id": "abc", "name": "Example" }
}
```

This ensures single-item endpoints have the same `response.data` access pattern as list endpoints, so client code stays consistent.

## Why envelopes?

Wrapping responses in `{ data }` and `{ data, meta }` instead of returning raw arrays/objects:

- **Extensibility** — metadata (pagination, rate limits, deprecation notices) can be added without breaking the `data` path
- **Consistency** — clients always read `response.data`, whether the endpoint returns one item or many
- **Type safety** — generic `<T>` flows through, so TypeScript consumers get the correct inner type
