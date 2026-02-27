---
title: Runtime + API Layer
description: Why Erato runs on SvelteKit + Workers with REST route handlers
---

# Runtime + API Layer

## Decision

Use SvelteKit on Cloudflare Workers with REST handlers (`+server.ts`) as the API surface.

## Why

- Same platform ergonomics as other apps in the monorepo.
- Low operational overhead on Workers.
- Good fit for route-first API design and incremental rollout.
- Keeps Erato aligned with existing TypeScript and Cloudflare tooling.

## Notes

- REST is preferred for current scope and latency profile.
- GraphQL remains a future option when query composition needs justify the complexity.
