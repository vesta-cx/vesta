---
title: Erato API Routes
description: Full CRUD API reference for all Erato endpoints
created: 2026-02-27
modified: 2026-02-27
---

# Erato API Routes

All routes are prefixed with `/v0`. Authentication is via `Authorization: Bearer <api-key>` header. Guest access (no auth) is noted per route.

## Health

| Method | Path      | Auth | Description  |
| ------ | --------- | ---- | ------------ |
| GET    | `/health` | No   | Health check |

## Identity

| Method | Path  | Auth     | Description                                          |
| ------ | ----- | -------- | ---------------------------------------------------- |
| GET    | `/me` | Required | Returns the authenticated subject's identity object  |

Resolves by API key `subjectType`:
- `user` — WorkOS user merged with local user extensions
- `organization` — WorkOS org merged with local org extensions
- `workspace` — Local workspace row

Returns `404` when subject entity not found, `401` for missing/invalid key.

## Users

| Method | Path         | Auth     | Scopes                        | Guest                |
| ------ | ------------ | -------- | ----------------------------- | -------------------- |
| GET    | `/users`     | Optional | `users:read`                  | Public profiles only |
| GET    | `/users/:id` | Optional | `users:read`                  | Public profile only  |
| POST   | `/users`     | Required | `admin`                       | No                   |
| PUT    | `/users/:id` | Required | `users:write` (self or admin) | No                   |
| DELETE | `/users/:id` | Required | `admin`                       | No                   |

## Workspaces

| Method | Path              | Auth     | Scopes                           | Guest       |
| ------ | ----------------- | -------- | -------------------------------- | ----------- |
| GET    | `/workspaces`     | Optional | `workspaces:read`                | Public only |
| GET    | `/workspaces/:id` | Optional | `workspaces:read`                | Public only |
| POST   | `/workspaces`     | Required | `workspaces:write`               | No          |
| PUT    | `/workspaces/:id` | Required | `workspaces:write` (owner/admin) | No          |
| DELETE | `/workspaces/:id` | Required | `workspaces:write` (owner/admin) | No          |

## Resources

| Method | Path             | Auth     | Scopes                          | Guest       |
| ------ | ---------------- | -------- | ------------------------------- | ----------- |
| GET    | `/resources`     | Optional | `resources:read`                | LISTED only |
| GET    | `/resources/:id` | Optional | `resources:read`                | LISTED only |
| POST   | `/resources`     | Required | `resources:write`               | No          |
| PUT    | `/resources/:id` | Required | `resources:write` (owner/admin) | No          |
| DELETE | `/resources/:id` | Required | `resources:write` (owner/admin) | No          |

### Resource Authors

| Method | Path                                                   | Auth     | Scopes            |
| ------ | ------------------------------------------------------ | -------- | ----------------- |
| GET    | `/resources/:resourceId/authors`                       | Optional | `resources:read`  |
| POST   | `/resources/:resourceId/authors`                       | Required | `resources:write` |
| DELETE | `/resources/:resourceId/authors/:authorType/:authorId` | Required | `resources:write` |

### Resource Post

| Method | Path                          | Auth     | Scopes            |
| ------ | ----------------------------- | -------- | ----------------- |
| GET    | `/resources/:resourceId/post` | Optional | `resources:read`  |
| PUT    | `/resources/:resourceId/post` | Required | `resources:write` |
| DELETE | `/resources/:resourceId/post` | Required | `resources:write` |

### Resource URLs

| Method | Path                                    | Auth     | Scopes            |
| ------ | --------------------------------------- | -------- | ----------------- |
| GET    | `/resources/:resourceId/urls`           | Optional | `resources:read`  |
| POST   | `/resources/:resourceId/urls`           | Required | `resources:write` |
| PUT    | `/resources/:resourceId/urls/:position` | Required | `resources:write` |
| DELETE | `/resources/:resourceId/urls/:position` | Required | `resources:write` |

## Collections

| Method | Path               | Auth     | Scopes                      | Guest       |
| ------ | ------------------ | -------- | --------------------------- | ----------- |
| GET    | `/collections`     | Optional | `collections:read`          | Public only |
| GET    | `/collections/:id` | Optional | `collections:read`          | Public only |
| POST   | `/collections`     | Required | `collections:write`         | No          |
| PUT    | `/collections/:id` | Required | `collections:write` (owner) | No          |
| DELETE | `/collections/:id` | Required | `collections:write` (owner) | No          |

### Collection Items

| Method | Path                                                 | Auth     | Scopes              |
| ------ | ---------------------------------------------------- | -------- | ------------------- |
| GET    | `/collections/:collectionId/items`                   | Required | `collections:read`  |
| POST   | `/collections/:collectionId/items`                   | Required | `collections:write` |
| DELETE | `/collections/:collectionId/items/:itemType/:itemId` | Required | `collections:write` |

### Collection Visibility

| Method | Path                                    | Auth     | Scopes                      |
| ------ | --------------------------------------- | -------- | --------------------------- |
| GET    | `/collections/:collectionId/visibility` | Required | `collections:read` (owner)  |
| PUT    | `/collections/:collectionId/visibility` | Required | `collections:write` (owner) |

### Collection Filters

| Method | Path                                 | Auth     | Scopes                      |
| ------ | ------------------------------------ | -------- | --------------------------- |
| GET    | `/collections/:collectionId/filters` | Required | `collections:read` (owner)  |
| PUT    | `/collections/:collectionId/filters` | Required | `collections:write` (owner) |

## Teams

| Method | Path         | Auth     | Scopes                |
| ------ | ------------ | -------- | --------------------- |
| GET    | `/teams`     | Required | `teams:read`          |
| GET    | `/teams/:id` | Required | `teams:read`          |
| POST   | `/teams`     | Required | `teams:write`         |
| PUT    | `/teams/:id` | Required | `teams:write` (owner) |
| DELETE | `/teams/:id` | Required | `teams:write` (owner) |

### Team Members

| Method | Path                             | Auth     | Scopes        |
| ------ | -------------------------------- | -------- | ------------- |
| GET    | `/teams/:teamId/members`         | Required | `teams:read`  |
| POST   | `/teams/:teamId/members`         | Required | `teams:write` |
| DELETE | `/teams/:teamId/members/:userId` | Required | `teams:write` |

## Organizations

Organizations use a **hybrid model**: WorkOS is source of truth for canonical identity fields; Erato D1 stores local extension fields (`avatarUrl`, `bannerUrl`, `themeConfig`). Responses are flattened merged objects — clients cannot distinguish which domain owns each field.

| Method | Path                  | Auth     | Scopes                 |
| ------ | --------------------- | -------- | ---------------------- |
| GET    | `/organizations`      | Required | `organizations:read`   |
| GET    | `/organizations/:id`  | Required | `organizations:read`   |
| POST   | `/organizations`      | Required | `organizations:write`  |
| PUT    | `/organizations/:id`  | Required | `organizations:write`  |
| DELETE | `/organizations/:id`  | Required | `organizations:write`  |

**List pagination**: Organizations list uses WorkOS cursor-based pagination (`after`, `before`, `limit` params), not offset-based. `runListQuery` is not used here.

**Example response** (`GET /organizations/:id`):

```json
{
  "data": {
    "id": "org_01EHWNCE74X7JSDV0X3SZ3KJNY",
    "name": "Glassnote Records",
    "avatarUrl": "https://cdn.vesta.cx/orgs/glassnote/avatar.png",
    "bannerUrl": null,
    "themeConfig": null,
    "createdAt": "2025-10-01T14:00:00Z",
    "updatedAt": "2025-10-15T09:30:00Z"
  }
}
```

## Engagements

| Method | Path               | Auth     | Scopes              |
| ------ | ------------------ | -------- | ------------------- |
| GET    | `/engagements`     | Required | `engagements:read`  |
| GET    | `/engagements/:id` | Required | `engagements:read`  |
| POST   | `/engagements`     | Required | `engagements:write` |
| PUT    | `/engagements/:id` | Required | `engagements:write` |
| DELETE | `/engagements/:id` | Required | `engagements:write` |

`PUT /engagements/:id` allows updating mutable sub-resources (`comment`, `mention`) only. Core identity fields (`subjectType`, `subjectId`, `action`, `objectType`, `objectId`) are immutable after creation.

## Permissions

| Method | Path               | Auth     | Scopes              |
| ------ | ------------------ | -------- | ------------------- |
| GET    | `/permissions`     | Required | `permissions:read`  |
| GET    | `/permissions/:id` | Required | `permissions:read`  |
| POST   | `/permissions`     | Required | `permissions:write` |
| PUT    | `/permissions/:id` | Required | `permissions:write` |
| DELETE | `/permissions/:id` | Required | `permissions:write` |

### Permission Actions

| Method | Path                        | Auth     | Scopes             |
| ------ | --------------------------- | -------- | ------------------ |
| GET    | `/permission-actions`       | Required | `permissions:read` |
| GET    | `/permission-actions/:slug` | Required | `permissions:read` |
| POST   | `/permission-actions`       | Required | `admin`            |
| PUT    | `/permission-actions/:slug` | Required | `admin`            |
| DELETE | `/permission-actions/:slug` | Required | `admin`            |

## Features

| Method | Path              | Auth     | Scopes          | Guest         |
| ------ | ----------------- | -------- | --------------- | ------------- |
| GET    | `/features`       | Optional | `features:read` | Yes (catalog) |
| GET    | `/features/:slug` | Optional | `features:read` | Yes           |
| POST   | `/features`       | Required | `admin`         | No            |
| PUT    | `/features/:slug` | Required | `admin`         | No            |
| DELETE | `/features/:slug` | Required | `admin`         | No            |

### Feature Pricing

| Method | Path                      | Auth     | Scopes          |
| ------ | ------------------------- | -------- | --------------- |
| GET    | `/features/:slug/pricing` | Optional | `features:read` |
| PUT    | `/features/:slug/pricing` | Required | `admin`         |

### Feature Presets

| Method | Path                     | Auth     | Scopes          |
| ------ | ------------------------ | -------- | --------------- |
| GET    | `/feature-presets`       | Optional | `features:read` |
| GET    | `/feature-presets/:name` | Optional | `features:read` |
| POST   | `/feature-presets`       | Required | `admin`         |
| PUT    | `/feature-presets/:name` | Required | `admin`         |
| DELETE | `/feature-presets/:name` | Required | `admin`         |

## Subscriptions

| Method | Path                     | Auth     | Scopes                            |
| ------ | ------------------------ | -------- | --------------------------------- |
| GET    | `/subscriptions/:userId` | Required | `subscriptions:read` (self/admin) |
| POST   | `/subscriptions`         | Required | `admin`                           |
| PUT    | `/subscriptions/:userId` | Required | `admin`                           |

### User Features

| Method | Path                            | Auth     | Scopes                    |
| ------ | ------------------------------- | -------- | ------------------------- |
| GET    | `/users/:userId/features`       | Required | `users:read` (self/admin) |
| POST   | `/users/:userId/features`       | Required | `admin`                   |
| DELETE | `/users/:userId/features/:slug` | Required | `admin`                   |

## Introspect

| Method | Path                 | Auth     | Scopes  |
| ------ | -------------------- | -------- | ------- |
| GET    | `/introspect/routes` | Required | `admin` |

## Response Envelopes

### List response

```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

### Single item response

```json
{
  "data": { ... }
}
```

### Error response

```json
{
  "error": "First error message",
  "errors": [
    { "code": "VALIDATION_ERROR", "message": "Field required", "path": "name" },
    { "code": "VALIDATION_ERROR", "message": "Invalid email", "path": "email" }
  ]
}
```

## Query Parameters

List endpoints support filtering, sorting, and pagination:

```
GET /resources?status=LISTED&type=post&sort=created_at&order=desc&limit=20&offset=0
```

- **Filters**: Only explicitly declared columns can be filtered (allowlist-only)
- **Sort**: `sort=<key>&order=asc|desc` (falls back to default on invalid key/order)
- **Pagination**: `limit=<1-100>&offset=<0+>` (defaults: limit=20, offset=0)
- **Like search**: Some text fields support LIKE with `%value%` wrapping
- **In operator**: Comma-separated values (e.g., `?type=post,song`)

## Scopes

21 scopes control API access:

| Scope                                            | Description                      |
| ------------------------------------------------ | -------------------------------- |
| `users:read` / `users:write`                     | User management                  |
| `workspaces:read` / `workspaces:write`           | Workspace management             |
| `organizations:read` / `organizations:write`     | Organization management          |
| `resources:read` / `resources:write`             | Resource management              |
| `collections:read` / `collections:write`         | Collection management            |
| `teams:read` / `teams:write`                     | Team management                  |
| `engagements:read` / `engagements:write`         | Engagement management            |
| `permissions:read` / `permissions:write`         | Permission management            |
| `features:read` / `features:write`               | Feature catalog management       |
| `subscriptions:read` / `subscriptions:write`     | Subscription management          |
| `admin`                                          | Full access, bypasses all checks |
