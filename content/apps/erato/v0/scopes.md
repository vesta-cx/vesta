---
title: Erato scopes (v0)
---

# Erato Route Scopes (v0)

Generated from `apps/erato/src/routes` metadata on 2026-02-27T16:43:17.344Z.

| Method | Path | Auth Required | Scopes |
| --- | --- | --- | --- |
| GET | `/v0/collections` | true | collections:read |
| POST | `/v0/collections` | true | collections:write |
| GET | `/v0/collections/:collectionId/filters` | true | collections:read |
| PUT | `/v0/collections/:collectionId/filters` | true | collections:write |
| GET | `/v0/collections/:collectionId/items` | true | collections:read |
| POST | `/v0/collections/:collectionId/items` | true | collections:write |
| DELETE | `/v0/collections/:collectionId/items/:itemType/:itemId` | true | collections:write |
| DELETE | `/v0/collections/:id` | true | collections:write |
| GET | `/v0/collections/:id` | true | collections:read |
| PUT | `/v0/collections/:id` | true | collections:write |
| GET | `/v0/engagements` | true | engagements:read |
| POST | `/v0/engagements` | true | engagements:write |
| DELETE | `/v0/engagements/:id` | true | engagements:write |
| GET | `/v0/engagements/:id` | true | engagements:read |
| PUT | `/v0/engagements/:id` | true | engagements:write |
| GET | `/v0/feature-presets` | true | features:read |
| POST | `/v0/feature-presets` | true | admin |
| DELETE | `/v0/feature-presets/:name` | true | admin |
| GET | `/v0/feature-presets/:name` | true | features:read |
| PUT | `/v0/feature-presets/:name` | true | admin |
| GET | `/v0/features` | true | features:read |
| POST | `/v0/features` | true | admin |
| DELETE | `/v0/features/:slug` | true | admin |
| GET | `/v0/features/:slug` | true | features:read |
| PUT | `/v0/features/:slug` | true | admin |
| GET | `/v0/features/:slug/pricing` | true | features:read |
| PUT | `/v0/features/:slug/pricing` | true | admin |
| GET | `/v0/health` | false | - |
| GET | `/v0/introspect/routes` | true | admin |
| GET | `/v0/links/:subjectType/:subjectId` | true | resources:read, workspaces:read |
| POST | `/v0/links/:subjectType/:subjectId` | true | resources:write, workspaces:write |
| DELETE | `/v0/links/:subjectType/:subjectId/:position` | true | resources:write, workspaces:write |
| PUT | `/v0/links/:subjectType/:subjectId/:position` | true | resources:write, workspaces:write |
| GET | `/v0/me` | true | - |
| GET | `/v0/organizations` | true | organizations:read |
| POST | `/v0/organizations` | true | organizations:write |
| DELETE | `/v0/organizations/:id` | true | organizations:write |
| GET | `/v0/organizations/:id` | true | organizations:read |
| PUT | `/v0/organizations/:id` | true | organizations:write |
| GET | `/v0/permission-actions` | true | permissions:read |
| POST | `/v0/permission-actions` | true | admin |
| DELETE | `/v0/permission-actions/:slug` | true | admin |
| GET | `/v0/permission-actions/:slug` | true | permissions:read |
| PUT | `/v0/permission-actions/:slug` | true | admin |
| GET | `/v0/permissions` | true | permissions:read |
| POST | `/v0/permissions` | true | permissions:write |
| DELETE | `/v0/permissions/:id` | true | permissions:write |
| GET | `/v0/permissions/:id` | true | permissions:read |
| PUT | `/v0/permissions/:id` | true | permissions:write |
| GET | `/v0/resources` | true | resources:read |
| POST | `/v0/resources` | true | resources:write |
| DELETE | `/v0/resources/:id` | true | resources:write |
| GET | `/v0/resources/:id` | true | resources:read |
| PUT | `/v0/resources/:id` | true | resources:write |
| GET | `/v0/resources/:resourceId/authors` | true | resources:read |
| POST | `/v0/resources/:resourceId/authors` | true | resources:write |
| DELETE | `/v0/resources/:resourceId/authors/:authorType/:authorId` | true | resources:write |
| DELETE | `/v0/resources/:resourceId/post` | true | resources:write |
| GET | `/v0/resources/:resourceId/post` | true | resources:read |
| PUT | `/v0/resources/:resourceId/post` | true | resources:write |
| GET | `/v0/resources/:resourceId/urls` | true | resources:read |
| POST | `/v0/resources/:resourceId/urls` | true | resources:write |
| DELETE | `/v0/resources/:resourceId/urls/:position` | true | resources:write |
| PUT | `/v0/resources/:resourceId/urls/:position` | true | resources:write |
| POST | `/v0/subscriptions` | true | admin |
| GET | `/v0/subscriptions/:userId` | true | subscriptions:read |
| PUT | `/v0/subscriptions/:userId` | true | admin |
| GET | `/v0/teams` | true | teams:read |
| POST | `/v0/teams` | true | teams:write |
| DELETE | `/v0/teams/:id` | true | teams:write |
| GET | `/v0/teams/:id` | true | teams:read |
| PUT | `/v0/teams/:id` | true | teams:write |
| GET | `/v0/teams/:teamId/members` | true | teams:read |
| POST | `/v0/teams/:teamId/members` | true | teams:write |
| DELETE | `/v0/teams/:teamId/members/:userId` | true | teams:write |
| GET | `/v0/users` | true | users:read |
| POST | `/v0/users` | true | admin |
| DELETE | `/v0/users/:id` | true | admin |
| GET | `/v0/users/:id` | true | users:read |
| PUT | `/v0/users/:id` | true | users:write |
| GET | `/v0/users/:userId/features` | true | users:read |
| POST | `/v0/users/:userId/features` | true | admin |
| DELETE | `/v0/users/:userId/features/:slug` | true | admin |
| GET | `/v0/workspaces` | true | workspaces:read |
| POST | `/v0/workspaces` | true | workspaces:write |
| DELETE | `/v0/workspaces/:id` | true | workspaces:write |
| GET | `/v0/workspaces/:id` | true | workspaces:read |
| PUT | `/v0/workspaces/:id` | true | workspaces:write |
| GET | `/v0/workspaces/:workspaceId/urls` | true | workspaces:read |
| POST | `/v0/workspaces/:workspaceId/urls` | true | workspaces:write |
| DELETE | `/v0/workspaces/:workspaceId/urls/:position` | true | workspaces:write |
| PUT | `/v0/workspaces/:workspaceId/urls/:position` | true | workspaces:write |
