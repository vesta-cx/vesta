---
title: Permissions
authors:
description: Permission model for subjects, objects, and actions with extensible action registry
created: 2025-10-13T14:46:10+02:00
modified: 2025-10-13T16:21:43+02:00
license:
license_url:
---

Permissions define which subjects can perform which actions on which objects. This is the core authorization model.

## Schema

### Permission Actions Table

Central registry of all possible actions (extensible):

```
permission_actions:
slug                 string primary key (e.g., "read", "write", "delete", "admin")
name                 string (display name: "Read")
description          text (what does this action allow?)
category             string ('content' | 'resource' | 'workspace' | 'admin')
created_at           timestamp
updated_at           timestamp
```

**Examples:**

```
read       | View/read     | User can view the object (posts, profiles, analytics)  | content
write      | Edit          | User can create/edit/update the object                | resource
delete     | Delete        | User can delete the object                             | workspace
admin      | Admin         | Full control including sharing/permissions             | admin
```

**Design principle:**

- Actions are extensible: add new actions without code changes
- Each action is documented with category for filtering
- Same pattern as features table (slug as PK)

### Permissions Table

```
permissions:
id                   UUID primary key
subject_type         string ('user' | 'team' | 'organization' | 'static')
subject_id           string (WorkOS user/org ID or UUID)
object_type          string ('workspace' | 'resource' | 'organization' | 'collection')
object_id            UUID
action               string FK → permission_actions.slug
value                string ('allow' | 'deny' | 'unset')
created_at           timestamp
updated_at           timestamp
```

## Subjects

- **User** — Individual user account (highest precedence)
- **Team** — Group of users; permissions inherited by all members (medium precedence)
- **Organization** — Organization-level permissions inherited by members (low precedence)
- **Static** — Audience subjects for client-side visibility contexts (`guest`, `user`, `follower`, `subscriber`)

## Objects

- **Workspace** — Artist or label profile
- **Resource** — Creative work (song, album, post)
- **Organization** — Organization-level resource
- **Collection** — Curated sets of resources/users/workspaces/collections

## Permission Values

- `unset` (default) — No explicit permission
- `allow` — Explicitly grant permission
- `deny` — Explicitly deny (override lower-priority grants)

## Permission Precedence (Highest to Lowest)

When determining if a user can perform an action:

```
1. user:deny       → NO (user explicitly denied)
2. user:allow      → YES (user explicitly allowed)
3. team:deny       → NO (any of user's teams explicitly denied)
4. team:allow      → YES (any of user's teams explicitly allowed)
5. org:allow       → YES (organization allowed)
6. unset/default   → NO (deny by default)
```

**Why this order?**

- User-level overrides beat team-level (fine-grained control)
- Deny beats allow at each level (safer default)
- Prevents permission drift (adding/removing users from teams doesn't require permission table updates)

## Permission Merger (Core Implementation)

The permission merger is a **context-less / stateless helper** in `packages/utils`.

App/client layers (Erato, web, headless frontends) are responsible for loading rows from tables (`permissions`, memberships, etc.). The helper only merges pre-fetched rows.

Both vesta and erato can call this helper to:

1. Receive already-fetched candidate rows (user, team, org, static)
2. Merge according to precedence rules
3. Return the effective permission value (`allow` | `deny` | `unset`)

The merger logic is stable and independent of API transport (REST, GraphQL, etc.).

### Required Predicate for Permission Checks

All permission checks must match on the full predicate:

- `subject_type`
- `subject_id`
- `object_type`
- `object_id`
- `action`
- `value`

Skipping any field can produce false positives (cross-subject or cross-action leakage).

### Permission Merger Contract (In-Memory)

```typescript
type PermissionRow = {
  subjectType: "user" | "team" | "organization" | "static"
  subjectId: string
  objectType: string
  objectId: string
  action: string
  value: "allow" | "deny" | "unset"
}

function resolvePermissionValue(rows: PermissionRow[], params: {
  objectType: string
  objectId: string
  action: string
  principals: Array<{ subjectType: PermissionRow["subjectType"]; subjectId: string }>
}) {
  // caller already fetched rows; helper only merges in memory
  // precedence (highest -> lowest): user, team, organization, static
  // within each level: deny beats allow
  return "allow" | "deny" | "unset"
}
```

### Query Strategy (Caller Responsibility)

To avoid N×action round trips:

1. Fetch relevant permission rows in bulk for known principals.
2. Filter by object/action as needed.
3. Call merger helper in memory for each decision.

## See Also

- [Features](../features/features.md) — Feature access and operational gating
- [Subscriptions](../subscriptions/subscriptions.md) — Billing-backed entitlement lifecycle
- [Teams](../identity/teams.md) — Team membership for permission inheritance
- [Users & Organizations (WorkOS-Managed)](../identity/users.md) — User identity and organization context
