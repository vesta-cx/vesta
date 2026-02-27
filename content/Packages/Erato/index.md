---
title: Erato
description: Data layer and REST API for vesta platform
---

# Erato

Erato is the data layer for vesta. It provides a type-safe, REST API over the vesta database, abstracting schema details and enabling multi-consumer access patterns.

## Purpose

During Phase 1, Erato is built **alongside** `apps/vesta` but not directly called—both apps share a D1 binding to the same database. This avoids network overhead while the bindings model is still valuable.

Once vesta scales to multiple consumers (mobile apps, third-party integrations, admin dashboards), Erato becomes the authoritative data source. At that point, `apps/vesta` switches from direct D1 access to calling Erato's REST API.

## Architecture

**Stack:**
- SvelteKit on Cloudflare Workers
- D1 binding (shared with `apps/vesta` during Phase 1)
- Drizzle ORM (shared schema in `packages/db`)
- REST API (HTTP routes via `+server.ts`)

**When Phase 1 → Phase 2 transition happens:**
- `apps/vesta` calls `erato.vesta.io` instead of DB directly
- Zero code changes in Erato itself
- Erato gains independent scaling, observability, rate limiting

## Database Access

### Phase 1: Direct Binding (Both Apps)

Both `apps/vesta` and `apps/erato` have D1 bindings:

```jsonc
// wrangler.jsonc (both apps)
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "vesta-db",
      "database_id": "abc123xyz"  // Same ID for both
    }
  ]
}
```

**Accessing the database:**

```typescript
// apps/erato/src/routes/api/creators/+server.ts
import { db } from '@vesta-cx/db';

export async function GET({ platform }) {
  const creators = await db.query.creators.findMany();
  return new Response(JSON.stringify(creators));
}
```

### Phase 2+: Erato as API

`apps/vesta` switches to HTTP calls:

```typescript
// apps/vesta/src/routes/dashboard/+page.server.ts
const res = await fetch('https://erato.vesta.io/api/creators');
const creators = await res.json();
```

## Development

```bash
# Start Erato in dev mode
pnpm --filter erato dev

# Erato starts on localhost:5173 (or configured port)
# Binds to local D1 (via getPlatformProxy)
```

## REST API (Phase 1)

See [Model](../../apps/erato/Model/) for schema, [app/stack](./app/stack) for implementation details, and [app/nanoid](./app/nanoid) for ID generation.

**Why REST, not GraphQL?**

GraphQL was considered, but deferred for Phase 1 + Phase 2. Reason: D1 bindings work best with minimal overhead. GraphQL adds query parsing, planning, and execution complexity that negates the latency advantage of direct database bindings. When Erato becomes a separate HTTP service (Phase 2+) or moves to a different database (PlanetScale, etc.), GraphQL becomes viable.

**Core endpoints (Phase 1 foundation):**

- `GET /api/creators` — List all creators (public? paginated?)
- `GET /api/creators/:id` — Get creator by ID
- `POST /api/creators` — Create creator (auth required)
- `PUT /api/creators/:id` — Update creator (auth required)
- `GET /api/resources` — List resources (filtered by visibility/permissions)
- `GET /api/resources/:id` — Get resource by ID
- `POST /api/resources` — Create resource (auth required)

More routes as vesta expands.

## GraphQL (Future: Phase 3+)

Once Erato is:
1. A separate Worker with its own HTTP boundary, OR
2. Running against a managed database (PlanetScale, Convex, SpaceTimeDB)

GraphQL becomes a sensible addition for:
- Complex multi-resource queries (e.g., "get all resources by these creators with these tags")
- Reduced over-fetching (mobile apps, third-party integrations)
- Cleaner client codegen

Until then, REST + explicit filtering/pagination is simpler and faster.

## Migration Path: D1 → PlanetScale / Convex / SpaceTimeDB

When vesta outgrows D1:

1. Keep all schema in `packages/db` (Drizzle handles dialect differences)
2. Set up new database (PlanetScale, Convex, etc.)
3. Run Drizzle migrations in new database
4. Update `wrangler.jsonc` to point to new database
5. Optional: Transition period with dual writes (if needed)
6. Data migration tool (export from D1, import to new DB)

**No changes to `apps/erato` API** — just a connection string change.

## See Also

- [vesta](../../apps/vesta/index.md) — Main public app
- [packages/db](../db/index.md) — Shared database layer
