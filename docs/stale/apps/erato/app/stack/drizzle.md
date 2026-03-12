---
title: Drizzle ORM
description: Why Drizzle is used for typed schema and query access in Erato
---

# Drizzle ORM

## Decision

Use Drizzle ORM for schema typing and query construction.

## Why

- Strong TypeScript support with compile-time query safety.
- Straightforward mapping to SQL concepts and Cloudflare D1.
- Shared schema import story with `@vesta-cx/db` keeps API and schema aligned.

## Usage Pattern

Erato creates a local Drizzle client factory that takes a `D1Database` from Hono's request context:

```ts
// src/db/index.ts
import { drizzle } from "drizzle-orm/d1"
import * as schema from "./schema"

export const getDb = (d1: D1Database) => drizzle(d1, { schema })
```

```ts
// In a route handler:
const db = getDb(c.env.DB)
const users = await db.query.users.findMany()
```
