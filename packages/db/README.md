# @vesta-cx/db

Shared [Drizzle ORM](https://orm.drizzle.team/) schema and entity schemas for the Vesta D1 database. This package exports table definitions, relations, enums, and types only — it does **not** export a database client. Each consuming app creates its own `getDb(platform)` factory.

## Install

```bash
pnpm i @vesta-cx/db
```

Peer / runtime: you need `drizzle-orm` and a D1 (or other Drizzle-compatible) client in your app.

## Exports

| Subpath | Contents |
|--------|----------|
| `@vesta-cx/db` | Schema exports (tables, relations, enums) |
| `@vesta-cx/db/schema` | Same schema barrel |
| `@vesta-cx/db/entity-schemas` | Zod-style entity schemas for validation |

## Usage

### 1. Re-export schema in your app

In your app (e.g. SvelteKit or Hono), create a local schema barrel that re-exports the package:

```ts
// src/lib/server/db/schema.ts (or equivalent)
export * from "@vesta-cx/db";
```

### 2. Create a DB factory (no module-level singleton)

D1 bindings are request-scoped. Create a factory that receives the platform or context:

**SvelteKit (Cloudflare):**

```ts
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export const getDb = (platform: App.Platform) =>
  drizzle(platform.env.DB, { schema });
```

**Hono (Workers):**

```ts
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export const getDb = (d1: D1Database) => drizzle(d1, { schema });
```

### 3. Use in routes

```ts
const db = getDb(platform);
const rows = await db.select().from(resources).where(eq(resources.status, "LISTED"));
```

## Implementation contracts and type semantics

Documentation that consumers must follow (no code in this package):

- [Collection type and kind](./docs/collection-types.md) — Contract: `type` (static | manual | smart) and `kind` (semantic); exactly one static per kind per owner, created with owner, cannot delete without deleting owner. Not yet in schema.
- [Collection visibility and dashboard resource reads](./docs/collection-visibility-and-dashboard-contract.md) — When `resources.status` (LISTED/UNLISTED) applies; recursive visibility; dashboard reads from `resources` table only.

## Migrations

Migrations live in this package. Consuming apps point Drizzle Kit at their local schema re-export and at a shared or local migrations directory. Apply with `wrangler d1 migrations apply` (Cloudflare) or your runtime’s migration runner.

## License

ISC
