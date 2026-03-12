---
title: operators.ts
description: Filter operator map and applyOperator helper
---

# `operators.ts`

Source: `packages/drizzle-query-factory/src/operators.ts`

Maps each `FilterOp` to its Drizzle ORM comparison function and exposes `applyOperator` for resolving them.

## `operatorMap` (internal)

```typescript
const operatorMap: Record<FilterOp, OperatorFn> = {
  eq: (col, val) => eq(col, val),
  like: (col, val) => like(col, `%${String(val)}%`),
  gt: (col, val) => gt(col, val),
  gte: (col, val) => gte(col, val),
  lt: (col, val) => lt(col, val),
  lte: (col, val) => lte(col, val),
  in: (col, val) => inArray(col, Array.isArray(val) ? val : [val]),
}
```

Notable behaviors:

- **`like`** wraps the value in `%…%` so it becomes a contains search. The consumer doesn't need to add wildcards
- **`in`** coerces a non-array value into a single-element array before passing to `inArray`. This safety net handles edge cases where a single value reaches the `in` path

## `applyOperator(op, column, value)`

```typescript
applyOperator(
  op: FilterOp,
  column: Column,
  value: unknown
): SQL
```

Resolves a `FilterOp` + Drizzle `Column` + value into a Drizzle `SQL` condition.

This is the low-level building block used internally by `parseListQuery`. It's exported for consumers who need to build conditions outside the query-param flow — for example, constructing filters programmatically in a service layer.

**Parameters:**

- **`op`** — One of `"eq"`, `"like"`, `"gt"`, `"gte"`, `"lt"`, `"lte"`, `"in"`
- **`column`** — A Drizzle `Column` reference (e.g. `resources.status`)
- **`value`** — The value to compare against. For `"in"`, should be an array (or will be wrapped in one)

**Returns:** A Drizzle `SQL` expression.

```typescript
import { applyOperator } from "@mia-cx/drizzle-query-factory"
import { resources } from "./schema"

const condition = applyOperator("gte", resources.createdAt, 1700000000)
// → gte(resources.createdAt, 1700000000)
```
