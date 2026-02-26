---
title: Organizations (WorkOS-Managed)
description: Organization schema from WorkOS; organizations own workspaces and contain users
---

# Organizations

Organizations are managed by WorkOS. Vesta does not store its own organizations table, but rather syncs data from WorkOS and uses them for access control, workspace ownership, and cross-app identity context.

## WorkOS Organization Schema

When querying or creating an organization via WorkOS, you receive an **Organization** object with these fields:

| Field        | Type      | Source | Vesta Use                                                                               |
| ------------ | --------- | ------ | --------------------------------------------------------------------------------------- |
| `id`         | string    | WorkOS | Unique organization ID (e.g., `org_01EHWNCE74X7JSDV0X3SZ3KJNY`); use as `workos_org_id` |
| `name`       | string    | WorkOS | Organization display name (e.g., "Glassnote Records", "vesta")                          |
| `created_at` | timestamp | WorkOS | When organization was created (ISO 8601)                                                |
| `updated_at` | timestamp | WorkOS | Last updated (ISO 8601)                                                                 |
| `object`     | string    | WorkOS | Always `"organization"` (resource type identifier)                                      |

**Example Organization:**

```json
{
  "object": "organization",
  "id": "org_01EHWNCE74X7JSDV0X3SZ3KJNY",
  "name": "vesta",
  "created_at": "2025-10-01T14:00:00Z",
  "updated_at": "2025-10-15T09:30:00Z"
}
```

## Organization Types in Vesta

### Global App Organizations

Every vesta instance has a **global organization** for all users who don't belong to a specific org:

| App     | Global Org ID   | Purpose                           |
| ------- | --------------- | --------------------------------- |
| vesta   | `org_vesta_*`   | Default org for all vesta users   |
| textile | `org_textile_*` | Default org for all textile users |
| mia.cx  | `org_miacx_*`   | Default org for all mia.cx users  |

All users in vesta belong to the "vesta" global org by default (see [[./users.md#organizational-architecture]]).

### Specific Organizations

Users can also belong to specific organizations (labels, collectives, teams):

| Example             | Purpose                                          |
| ------------------- | ------------------------------------------------ |
| "Glassnote Records" | Record label; can own multiple artist workspaces |
| "Indie Collective"  | Group of independent artists collaborating       |
| "Production Team"   | Internal team within a label                     |

## Workspace Ownership

Organizations can own [[./workspaces.md|Workspaces]] (just like users can):

```sql
-- Get all workspaces owned by an organization
SELECT * FROM workspaces WHERE owner_type = 'organization' AND owner_id = {workos_org_id};

-- Example: Get all artist workspaces under "Glassnote Records"
SELECT * FROM workspaces WHERE owner_type = 'organization' AND owner_id = 'org_glassnote_123';
```

**Use case:** A record label owns multiple artist workspaces. Each workspace is a separate publishing entity (artist profile), but all are under the label's organizational umbrella.

## Membership & Roles

Users are members of organizations and can have roles assigned by WorkOS:

**Organization roles (managed in WorkOS Dashboard):**

- `admin` — Full control over organization and its members
- `member` — Standard member (read/write access to organization resources)
- `viewer` — Read-only access

Roles affect permissions on resources and workspaces owned by the organization (via the [[./Permissions.md]] model).

## No Custom Attributes on WorkOS Organizations

Similar to [[./users.md#no-custom-attributes-on-workos]], vesta-specific org data is stored in vesta DB, not in WorkOS custom attributes.

**Store in vesta DB:**

- Organization settings (branding, preferences)
- Subscription/billing info
- Analytics and metrics
- Organization-specific features/flags

**Why?** Avoid namespace collisions in shared WorkOS workspace and keep vesta independent.

## Session Context: Organization

After authentication, store organization context in session:

```typescript
// Session from WorkOS
const session = {
  workos_user_id: profile.id,
  organization_id: profile.organization_id, // Never null; at least the app's global org
  email: profile.email,
  // ... other user fields
}
```

When loading vesta resources, use `organization_id` to scope queries:

```typescript
// Load all workspaces for this user's org
const workspaces = await db.query.workspaces.findMany({
  where: (workspaces, { eq }) => eq(workspaces.owner_id, session.organization_id),
})
```

## See Also

- [[./users.md|Users & Organizations (WorkOS-Managed)]] — User schema and multi-org architecture
- [[./workspaces.md|Workspaces]] — How workspaces reference organizations
- [[./Permissions.md]] — Permission model (subjects include org members)
