---
title: packages/db
description: Shared database schemas, Drizzle ORM configuration, and migration utilities for vesta
---

# packages/db

`packages/db` is the shared database layer for all vesta apps. It contains Drizzle ORM schemas, type definitions, query utilities, and migration management.

## Purpose

- **Single source of truth** for database schema across all apps (`apps/vesta`, `apps/erato`, future consumers)
- **Type-safe** database access via Drizzle ORM
- **Database-agnostic** — supports D1 (SQLite), PostgreSQL, MySQL; migration path for future scaling
- **Shared types** — exported as `@vesta-cx/db` for consuming apps

## Actual Schema Source Files

All schemas are defined in `packages/db/src/schema/*.ts` and re-exported by `packages/db/src/schema/index.ts`.

- `users.ts` — WorkOS user identities
- `workspaces.ts` — Publishing entities (owner, visibility, profile metadata)
- `resources.ts` — Base resources + `resource_authors`
- `posts.ts` — Post-type extension table
- `resource-urls.ts` — Smart links attached to resources
- `permissions.ts` — Permission actions + permission matrix
- `teams.ts` — Teams and team-user membership
- `engagements.ts` — Interactions, comments, mentions
- `collections.ts` — Curated lists, items, visibility/filtering
- `features.ts` — Features, pricing, presets, `user_features`, `user_subscriptions`

## Schema Docs (Canonical)

Detailed model docs live under:

- [packages/db model index](./model/index.md)
- [Identity](./model/identity/users.md)
- [Access](./model/access/permissions.md)
- [Resources](./model/resources/resource.md)
- [Collections](./model/collections/collections.md)
- [Features](./model/features/features.md)
- [Subscriptions](./model/subscriptions/subscriptions.md)

## How to Consume `@vesta-cx/db`

`@vesta-cx/db` exports schema definitions only. Consuming apps create their own Drizzle client.

### 1) Re-export shared schema in app code

```typescript
// apps/<app>/src/lib/server/db/schema.ts
export * from "@vesta-cx/db"
```

### 2) Create app-local db factory

```typescript
// apps/<app>/src/lib/server/db/index.ts
import { drizzle } from "drizzle-orm/d1"
import * as schema from "./schema"

export const getDb = (platform: App.Platform) => drizzle(platform.env.DB, { schema })
```

### 3) Query with typed schema

```typescript
// apps/<app>/src/routes/api/workspaces/+server.ts
import { getDb } from "$lib/server/db"

export const GET = async ({ platform }) => {
  const db = getDb(platform)
  const workspaces = await db.query.workspaces.findMany()
  return new Response(JSON.stringify(workspaces))
}
```

### 4) Configure drizzle for the app

```typescript
// apps/<app>/drizzle.config.ts
export default defineConfig({
  schema: "./src/lib/server/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
})
```

### 5) After schema changes

```bash
pnpm --filter @vesta-cx/db build
```

## Migrations

### Generate Migration

```bash
pnpm --filter @vesta-cx/db generate
```

Outputs: `packages/db/src/migrations/NNNN_description.sql`

### Apply Migrations (Local D1)

```bash
# Apply to local dev database
pnpm --filter vesta db:migrate:local

# Or via Wrangler directly
pnpm wrangler d1 migrations apply vesta-db-dev
```

### Apply Migrations (Production D1)

```bash
# Apply to production database
pnpm --filter vesta db:migrate

# Or via Wrangler
pnpm wrangler d1 migrations apply vesta-db
```

## Database Migration Path: D1 → PlanetScale / Convex / SpaceTimeDB

When scaling beyond D1:

### 1. Update Drizzle Config

```typescript
// drizzle.config.ts
export default {
  schema: "./src/schema",
  out: "./src/migrations",
  driver: "mysql2", // Change from 'better-sqlite' to 'mysql2' for PlanetScale
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
}
```

### 2. Set Up New Database

```bash
# Create PlanetScale database
pscale database create vesta

# Get connection string
pscale connect vesta main
```

### 3. Run Migrations

```bash
# Generate migrations for new dialect (if needed)
pnpm --filter @vesta-cx/db generate

# Apply from a consumer app (the app owns runtime DB credentials/bindings)
pnpm --filter <consumer-app> db:migrate:planetscale
```

Example consumer-app script:

```json
{
  "scripts": {
    "db:migrate:planetscale": "drizzle-kit migrate --config ./drizzle.config.ts"
  }
}
```

`packages/db` owns schema and generated migrations. The consuming app executes migration application because it owns environment-specific connection details and deployment context.

### 4. Data Migration (if needed)

```bash
# Export from D1
pnpm wrangler d1 execute vesta-db --command "SELECT * FROM creators" > creators.sql

# Import to PlanetScale
mysql vesta < creators.sql
```

### 5. Update Connection Strings

In apps' `wrangler.jsonc` or environment:

```jsonc
// Before (D1)
{
  "d1_databases": [{ "binding": "DB", "database_id": "abc123" }]
}

// After (PlanetScale via D1 Connector)
{
  "env": {
    "production": {
      "d1_databases": [],
      "vars": {
        "DATABASE_URL": "mysql://user:pass@host/db"
      }
    }
  }
}
```

**No code changes in apps** — just a connection string swap.

## Development

```bash
# Install dependencies
pnpm install

# Generate migrations (after schema changes)
pnpm --filter @vesta-cx/db generate

# Apply migrations locally
pnpm --filter vesta db:migrate:local

# Run tests (if any)
pnpm --filter @vesta-cx/db test
```

## Versioning & Publishing

Once `packages/db` is stable, publish to npm:

```bash
pnpm publish --filter @vesta-cx/db
```

Other projects can then:

```bash
npm install @vesta-cx/db
```

## See Also

- [erato](../../apps/erato/index.md) — Data layer API app (consumes this package)
- [vesta](../../apps/vesta/index.md) — Main app (consumes this package)
- [utils](../utils) — Shared auth, storage helpers
- [Drizzle ORM Docs](https://orm.drizzle.team/)
