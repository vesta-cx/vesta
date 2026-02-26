---
title: Permissions
authors:
description: Permission model for subjects, objects, and actions
created: 2025-10-13T14:46:10+02:00
modified: 2025-10-13T16:21:43+02:00
license:
license_url:
---

Permissions define which subjects can perform which actions on which objects. This is the core authorization model.

## Fields

| Field          | Type      | Description                                        |
| -------------- | --------- | -------------------------------------------------- |
| `id`           | UUID      | Identifier for the permission                      |
| `subject_type` | Enum      | Type of subject (user, organization, team)         |
| `subject_id`   | UUID      | ID of the subject                                  |
| `object_type`  | Enum      | Type of object (workspace, resource, organization) |
| `object_id`    | UUID      | ID of the object                                   |
| `action`       | Enum      | Action permitted (read, write, delete, admin)      |
| `created_at`   | Timestamp | When the permission was created                    |

## Subjects

- **User** — Individual user account (highest precedence)
- **Team** — Group of users; permissions inherited by all members (medium precedence)
- **Organization** — Organization-level permissions inherited by members (low precedence)
- **Global subjects** — `guest` (unauthenticated), `user` (any logged-in user), `follower`, `subscriber`

## Objects

- **Workspace** — Artist or label profile
- **Resource** — Creative work (song, album, post)
- **Organization** — Organization-level resource

## Actions

- **read** — View the object
- **write** — Edit/update the object
- **delete** — Delete the object
- **admin** — Full control including sharing/permission management

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

**This is business logic required immediately by vesta app.** The permission merger must be implemented in `packages/db` as a reusable query function/repository, not deferred to erato API.

Both vesta and erato (when built) will call this function to:
1. Load all relevant permissions (user, team, org)
2. Merge according to precedence rules
3. Return the computed permission value for each action

The merger logic is stable and independent of API transport (REST, GraphQL, etc.).

### Permission Merger Implementation

```typescript
async function canUserDoAction(userId, objectId, action) {
  // 1. Check user-level permissions
  const userDeny = await db.permissions.findFirst({
    where: { subject_type: 'user', subject_id: userId, object_id: objectId, action, value: 'deny' }
  });
  if (userDeny) return false; // User explicitly denied
  
  const userAllow = await db.permissions.findFirst({
    where: { subject_type: 'user', subject_id: userId, object_id: objectId, action, value: 'allow' }
  });
  if (userAllow) return true; // User explicitly allowed
  
  // 2. Check team-level permissions (user is member of these teams)
  const userTeams = await db.teams.members.findMany({
    where: { user_id: userId }
  });
  
  const teamDeny = await db.permissions.findFirst({
    where: { 
      subject_type: 'team', 
      subject_id: { in: userTeams.map(t => t.team_id) }, 
      object_id: objectId, 
      action, 
      value: 'deny' 
    }
  });
  if (teamDeny) return false; // Any team explicitly denied
  
  const teamAllow = await db.permissions.findFirst({
    where: { 
      subject_type: 'team', 
      subject_id: { in: userTeams.map(t => t.team_id) }, 
      object_id: objectId, 
      action, 
      value: 'allow' 
    }
  });
  if (teamAllow) return true; // Any team explicitly allowed
  
  // 3. Check organization-level (if applicable)
  const org = await getUserOrganization(userId);
  const orgAllow = await db.permissions.findFirst({
    where: { subject_type: 'organization', subject_id: org.id, object_id: objectId, action, value: 'allow' }
  });
  if (orgAllow) return true;
  
  // 4. Default: deny
  return false;
}
```
