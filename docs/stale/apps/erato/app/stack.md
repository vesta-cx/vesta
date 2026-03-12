---
title: Erato Stack
authors:
description: Technology stack and infrastructure for Erato
created: 2025-10-24T13:04:27+02:00
modified: 2025-10-24T13:13:57+02:00
license:
license_url:
---

## Technology Stack

**Application Layer:**

- SvelteKit service app (`apps/erato`)
- REST API handlers (`+server.ts` routes)

**ORM:**

- Drizzle ORM — Type-safe SQL builder for TypeScript
- Shared schema definitions from `@vesta-cx/db`

**Database:**

- D1 (Cloudflare SQLite)
- Type-safe schema definitions via Drizzle + shared schema package

**Runtime/Hosting:**

- Cloudflare Workers

## Data Access Model

- Phase 1-2: Direct D1 bindings are acceptable for app-level speed, while Erato API surface is formed.
- Phase 2+: Consumers should use Erato as the primary HTTP data boundary.

See [Erato Architecture & Data Access](./architecture.md) for full phase context and migration direction.
