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

## Structure

```
packages/db/
├── src/
│   ├── schema/
│   │   ├── creators.ts          # Creator profiles, labels
│   │   ├── posts.ts             # Posts, updates
│   │   ├── smart-links.ts       # Smart link configs
│   │   ├── engagement.ts        # Likes, comments, reposts
│   │   ├── collections.ts       # Collections (curated lists)
│   │   ├── subscriptions.ts     # User follows, subscriptions
│   │   ├── pricing.ts           # Plans, tiers
│   │   └── index.ts             # Export all schemas
│   ├── queries/
│   │   ├── creators.ts          # Creator queries (repository pattern)
│   │   ├── posts.ts             # Post queries
│   │   ├── smart-links.ts       # Smart link queries
│   │   └── index.ts             # Export all query builders
│   ├── migrations/
│   │   ├── 0001_initial.sql
│   │   ├── 0002_add_posts.sql
│   │   └── ...
│   ├── client.ts                # Drizzle client factory
│   ├── index.ts                 # Main export
│   └── types.ts                 # TypeScript types for DB entities
├── drizzle.config.ts            # Drizzle config (migrations, dialect)
├── package.json
└── README.md
```

## Usage in Apps

### Define Schema

```typescript
// packages/db/src/schema/creators.ts
import { sqliteTable, text, timestamp, integer } from 'drizzle-orm/sqlite-core';

export const creators = sqliteTable('creators', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  bio: text('bio'),
  email: text('email').unique().notNull(),
  workosOrgId: text('workos_org_id').unique(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type Creator = typeof creators.$inferSelect;
export type NewCreator = typeof creators.$inferInsert;
```

### Query via Repository Pattern

```typescript
// packages/db/src/queries/creators.ts
import { db } from '../client';
import { creators } from '../schema';
import { eq } from 'drizzle-orm';

export const creatorsQueries = {
  async findById(id: string) {
    return db.query.creators.findFirst({
      where: eq(creators.id, id),
    });
  },

  async findBySlug(slug: string) {
    return db.query.creators.findFirst({
      where: eq(creators.slug, slug),
    });
  },

  async create(data: NewCreator) {
    const [created] = await db.insert(creators).values(data).returning();
    return created;
  },

  async update(id: string, data: Partial<Creator>) {
    const [updated] = await db
      .update(creators)
      .set(data)
      .where(eq(creators.id, id))
      .returning();
    return updated;
  },
};
```

### Use in Apps

```typescript
// apps/vesta/src/routes/dashboard/+page.server.ts
import { creatorsQueries } from '@vesta-cx/db';

export async function load({ locals, platform }) {
  const creatorId = locals.userId;
  const creator = await creatorsQueries.findById(creatorId);
  return { creator };
}
```

## Drizzle Client Setup

```typescript
// packages/db/src/client.ts
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export function getDb(d1: D1Database) {
  return drizzle(d1, { schema });
}
```

In apps, instantiate the client:

```typescript
// apps/vesta/src/routes/api/creators/+server.ts
import { getDb } from '@vesta-cx/db';

export async function GET({ platform }) {
  const db = getDb(platform.env.DB);
  const creators = await db.query.creators.findMany();
  return new Response(JSON.stringify(creators));
}
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
  schema: './src/schema',
  out: './src/migrations',
  driver: 'mysql2',  // Change from 'better-sqlite' to 'mysql2' for PlanetScale
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
};
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

# Apply to new database
pnpm --filter @vesta-cx/db db:migrate:planetscale
```

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

- [[../erato]] — Data layer API (consumes this package)
- [[../Apps/vesta]] — Main app (consumes this package)
- [[../utils]] — Shared auth, storage helpers
- [Drizzle ORM Docs](https://orm.drizzle.team/)
