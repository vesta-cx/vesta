---
title: Shared Schema Package (@vesta-cx/db)
description: How Erato consumes the shared db schema package
---

# Shared Schema Package (`@vesta-cx/db`)

## Decision

Keep schema ownership in `packages/db` and consume it from Erato.

## Why

- Single source of truth for schema across all consumers.
- Avoids schema drift between Erato and other apps.
- Enables app-level client factories while preserving shared model definitions.

## Consumption

```ts
// apps/erato/src/db/schema.ts
export * from "@vesta-cx/db/schema"
```

```ts
// apps/erato/src/db/index.ts
import { drizzle } from "drizzle-orm/d1"
import * as schema from "./schema"

export const getDb = (d1: D1Database) => drizzle(d1, { schema })
```

Migrations are generated in `packages/db` and applied by Erato via `wrangler d1 migrations apply`.
