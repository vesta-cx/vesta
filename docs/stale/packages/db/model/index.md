---
title: packages/db Data Model
description: Domain-organized model documentation for shared Drizzle schemas
---

# packages/db Data Model

These docs describe the shared schema source of truth in `packages/db/src/schema`, organized by domain for easier navigation.

## Concepts

### Owner vs actor

- **Resource owner / workspace owner** — Always a **real identity or legal entity**: `user` (person) or `organization`. These own assets and are used for permissions and billing.
- **Collection owner** — An **actor** on the platform. Only **users** and **workspaces** are actors. Collections are owned by `user` or `workspace`; the owner is who curates the list and controls filters.
- **Organizations** — Purely operational (billing, teams, org-level settings). Not exposed as public actors; they do not own collections or appear as engagement subjects/objects.

So: "owner" for resources/workspaces = who legally/accountably owns the thing. "Owner" for collections = which actor (user or workspace) curates the collection.

### Permission vs engagement (subject–action–object)

Both permissions and engagements use a subject–action–object shape; the semantics differ:

| | Permission | Engagement |
|--|-----------|------------|
| **Subject** | Entity *attempting* to perform an action (e.g. user, team, organization). | Entity that *performed* the action (user or workspace only). |
| **Action** | The action being *attempted* (e.g. `resources:write`, `collections:read`). | The action that *was performed* (e.g. like, comment, repost, follow). |
| **Object** | Entity to be *acted upon* (workspace, resource, organization, collection). Users can always edit themselves; to let others edit a presence, use a workspace. | Entity that *was acted upon* (resource, workspace, collection, user). No teams or organizations — they are not public-facing. |

See [Permissions](./access/permissions.md#subject-action-object-semantics) and [Engagements](./collections/engagements.md) for schema details.

## Domains

- **Identity**
  - [Users & Organizations (WorkOS-Managed)](./identity/users.md)
  - [Organizations (WorkOS-Managed)](./identity/organizations.md)
  - [Teams](./identity/teams.md)
  - [Workspaces](./identity/workspaces.md)
- **Access**
  - [Permissions](./access/permissions.md)
- **Resources**
  - [Resource](./resources/resource.md)
  - [Resource URLs (Smart Links)](./resources/resource_urls.md)
  - [Post Resource Type](./resources/types/posts.md)
- **Collections**
  - [Engagements](./collections/engagements.md)
  - [Collections](./collections/collections.md)
- **Features**
  - [Features](./features/features.md)
- **Subscriptions**
  - [Subscriptions](./subscriptions/subscriptions.md)
