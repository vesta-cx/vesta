---
title: Erato Architecture & Data Access
description: How Erato is positioned in Phase 1 vs future phases, and how database access works
---

# Erato Architecture & Data Access

## Phase 1 (Current)

During Phase 1, Erato is built **alongside** `apps/vesta` but is not the mandatory runtime data hop yet. Both apps can use a D1 binding to the same database, which avoids extra network overhead while the product is still evolving quickly.

Key point:

- `packages/db` is the schema source of truth.
- Apps consume those schemas and create their own Drizzle client.
- Erato remains the API boundary directionally, but not every consumer has to go through it yet.

## Phase 2+ Direction

As vesta scales to multiple consumers (mobile apps, third-party integrations, admin tooling), Erato becomes the authoritative service boundary and consumers call Erato over HTTP.

At that point:

- `apps/vesta` shifts from direct DB reads to Erato REST endpoints.
- Erato centralizes API concerns (validation, authorization, pagination, error contracts, observability).
- Schema ownership still remains in `packages/db`.

## Stack Definition

- Runtime: SvelteKit on Cloudflare Workers
- Database: Cloudflare D1 (Phase 1), managed DB possible later
- ORM: Drizzle ORM
- Schema package: `@vesta-cx/db`
- API style: REST (GraphQL deferred)

## How DB Access Works in Erato

Erato should consume `@vesta-cx/db` schemas and create a local Drizzle client from platform bindings.

```ts
// apps/erato/src/lib/server/db/schema.ts
export * from "@vesta-cx/db"
```

```ts
// apps/erato/src/lib/server/db/index.ts
import { drizzle } from "drizzle-orm/d1"
import * as schema from "./schema"

export const getDb = (platform: App.Platform) => drizzle(platform.env.DB, { schema })
```

Then route handlers query typed tables through that client.

## Related

- [Erato index](../index.md)
- [Erato stack decisions](./stack/index.md)
- [packages/db model index](../../../packages/db/model/index.md)
