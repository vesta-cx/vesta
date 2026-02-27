<!-- @format -->

# Erato

Backend REST API for the Vesta data layer, built on Hono + Cloudflare Workers.

## Quick Start

```sh
pnpm install
pnpm run dev
```

```sh
pnpm run deploy
```

[Generate/synchronize types based on your Worker configuration:](https://developers.cloudflare.com/workers/wrangler/commands/#types)

```sh
pnpm run cf-typegen
```

## Versioning

`dev` and `deploy` are version-aware:

- API major is derived from `package.json` via `semver`
- Deploy target is `wrangler --env v<major>`
- Route is env-scoped to `erato.vesta.cx/v<major>/*`

This allows multiple API majors to stay live concurrently.

## Authentication

All routes (except `/health`) require an API key via `Authorization: Bearer <api-key>`.

API keys are stored in Cloudflare KV. Each key is associated with a `subjectType` (`user`, `organization`, or `workspace`) and `subjectId`, plus an array of scopes.

The `admin` scope bypasses all scope and row-level permission checks.

## Shared Entity Schemas

Canonical entity validation schemas now live in `@vesta-cx/db/entity-schemas` and are reused by Erato services.

- Shared package owns canonical entity shapes and enum-safe field constraints.
- Erato keeps route-specific payload schemas local to route files when they are endpoint-specific.
- Import examples in Erato services:
  - `resourceCreateSchema`, `resourceUpdateSchema`
  - `workspaceCreateSchema`, `workspaceUpdateSchema`
  - `userCreateSchema`, `userUpdateSchema`
  - `collectionCreateSchema`, `collectionUpdateSchema`

## Hybrid Data Model (WorkOS + Local D1)

**Users** and **Organizations** follow a hybrid ownership model:

- **WorkOS** is the source of truth for canonical identity fields (name, email, timestamps)
- **Local D1 tables** store Vesta-specific extension fields (avatarUrl, bannerUrl, themeConfig, bio)
- API responses return **flattened merged objects** — clients cannot distinguish which domain owns each field
- Writes only touch the domain(s) that own the changed fields; partial failures return explicit errors

### Key Endpoints

| Endpoint | Description |
| --- | --- |
| `GET /me` | Returns authenticated subject's identity (user/org/workspace) |
| `GET /organizations` | Lists organizations (WorkOS-sourced, cursor-paginated) |
| `GET /organizations/:id` | Gets organization with local extensions merged |
| `POST /organizations` | Creates org on WorkOS + optional local extensions |
| `PUT /organizations/:id` | Updates org (routes fields to WorkOS or local by ownership) |
| `DELETE /organizations/:id` | Deletes org from WorkOS + local extensions |

### Environment

WorkOS integration requires these secrets in Wrangler config:

- `WORKOS_API_KEY` — WorkOS API key
- `WORKOS_CLIENT_ID` — WorkOS client ID

## API Reference

Full endpoint reference: see `apps/docs/content/apps/erato/api-routes.md`

21 scopes across 10 domains plus `admin`. See route docs for per-endpoint scope requirements.
