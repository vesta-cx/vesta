---
title: Users & Organizations (WorkOS-Managed)
description: User and Organization schema from WorkOS, including custom attributes strategy
---

# Users & Organizations

Users and Organizations are managed by WorkOS via SSO/AuthKit. Vesta does not store its own users table, but rather syncs data from WorkOS and extends it with custom attributes as needed.

## WorkOS User (Profile) Schema

When a user authenticates via WorkOS, we receive a **User** or **Profile** object depending on the flow:

### User ID Formats

WorkOS generates user IDs with different prefixes for different flows:

| Format   | Flow                         | Use Case                                          | Phase    |
| -------- | ---------------------------- | ------------------------------------------------- | -------- |
| `usr_*`  | AuthKit User Management      | Self-serve artist signup; direct user creation    | Phase 1+ |
| `prof_*` | SSO Profile (IdP connection) | Enterprise label; multi-employee SSO provisioning | Phase 3+ |

Both formats should be treated identically in vesta—they're just two ways to acquire users. Store both as `workos_user_id` (no differentiation needed in DB). In the permissions table, both are stored with `subject_type: 'user'` and the full ID in `subject_id`. The prefix is informational; permission evaluation treats them identically.

### Profile Fields

When a user authenticates via WorkOS, we receive a **Profile** object with these fields:

| Field               | Type   | Source | Vesta Use                                                                                                                                                      |
| ------------------- | ------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                | string | WorkOS | Unique user ID (store as `workos_user_id`)                                                                                                                     |
| `email`             | string | WorkOS | User email                                                                                                                                                     |
| `first_name`        | string | WorkOS | User's first name                                                                                                                                              |
| `last_name`         | string | WorkOS | User's last name                                                                                                                                               |
| `connection_id`     | string | WorkOS | SSO connection used                                                                                                                                            |
| `connection_type`   | string | WorkOS | SSO type (OktaSAML, GoogleOAuth, etc.)                                                                                                                         |
| `organization_id`   | string | WorkOS | **Never null in practice.** Every user belongs to an org: specific (e.g., "Glassnote Records") or global "vesta" org (default). See organizational note below. |
| `role`              | object | WorkOS | Primary role (slug)                                                                                                                                            |
| `roles`             | array  | WorkOS | All assigned roles                                                                                                                                             |
| `idp_id`            | string | WorkOS | Identity provider's user ID                                                                                                                                    |
| `custom_attributes` | object | WorkOS | Custom mapped attributes (e.g., department, job_title)                                                                                                         |

**Example Profile:**

```json
{
  "id": "prof_01DMC79VCBZ0NY2099737PSVF1",
  "email": "artist@label.com",
  "first_name": "Taylor",
  "last_name": "Swift",
  "connection_type": "GoogleOAuth",
  "organization_id": "org_01EHWNCE74X7JSDV0X3SZ3KJNY",
  "role": { "slug": "admin" },
  "custom_attributes": {
    "genre": "pop",
    "label_name": "Republic Records"
  }
}
```

### Custom Attributes Strategy

Custom attributes can be set on WorkOS Profiles (via Dashboard or API) for vesta-specific data. Choose what goes on WorkOS vs. our DB:

**Store in WorkOS custom_attributes (shared across services):**

- Genre preferences
- Label/organization name
- Artist category (musician, label, curator, etc.)
- Any multi-service metadata

**Store in our DB (vesta-specific):**

- Workspace associations (see [Workspaces](./workspaces.md))
- Subscription tier & billing info
- Profile theme/customization (colors, fonts)
- Preferences (notification settings, privacy)
- Engagement activity (follows, likes, collections)

**Why split?**

- WorkOS custom attributes are shared if other apps use the same identity
- Vesta-specific data keeps our system independent
- Reduces WorkOS API calls for every page load

## WorkOS Organization Schema

Organizations are managed by WorkOS for enterprise/team use. Fields include:

| Field        | Type      | Source | Vesta Use                 |
| ------------ | --------- | ------ | ------------------------- |
| `id`         | string    | WorkOS | Unique organization ID    |
| `name`       | string    | WorkOS | Organization display name |
| `created_at` | timestamp | WorkOS | When org was created      |
| `updated_at` | timestamp | WorkOS | Last updated              |

Organizations can be the owner of [Workspaces](./workspaces.md) (e.g., a record label with multiple artist workspaces).

### Organizational Architecture (Multi-App Context)

**Important:** The WorkOS workspace hosts **multiple apps**: vesta, textile, mia.cx, and potentially more. To keep user identity unified across all apps, every user belongs to an organization.

**Organization hierarchy:**

- **Global orgs (one per app):** `vesta`, `textile`, `mia.cx`, etc. — all users in an app belong to its global org by default
- **Specific orgs:** Record labels, collectives, teams — users can be members of these for collaboration

**When a user signs up for vesta:**

1. WorkOS creates/assigns them to the `vesta` global organization
2. They can be invited to specific organizations (labels, teams) later
3. `organization_id` is **never null** — always at least the global org

**Why?**

- Unified IdP across `mia.cx` apps (same WorkOS workspace)
- Users can be part of multiple org contexts without data duplication
- Permissions and access control work consistently across all apps

**For vesta specifically:**

- Assume `profile.organization_id` always exists
- Treat it as the user's "home org" (usually "vesta" global org)
- Use it to load default settings, preferences, and workspaces

## Workspaces Ownership

Workspaces are owned by **either** a User or an Organization:

```sql
-- Query all workspaces owned by a specific user
SELECT * FROM workspaces WHERE owner_id = {workos_user_id};

-- Query all workspaces owned by a specific organization
SELECT * FROM workspaces WHERE owner_id = {workos_org_id};

-- To distinguish, use owner_type
SELECT * FROM workspaces WHERE owner_type = 'user' AND owner_id = {workos_user_id};
SELECT * FROM workspaces WHERE owner_type = 'organization' AND owner_id = {workos_org_id};
```

The `workspaces` table has:

- `id` — Unique workspace ID
- `owner_type` — `'user' | 'organization'`
- `owner_id` — WorkOS user ID or org ID

## Session Management

After authentication, store in session:

```typescript
// Session from WorkOS OAuth
const session = {
  workos_user_id: profile.id,
  email: profile.email,
  first_name: profile.first_name,
  last_name: profile.last_name,
  organization_id: profile.organization_id, // never null; always at least the app's global org
  workspaces: [
    /* list of workspace IDs they can access */
  ],
}
```

Use this to:

1. Load workspaces they own or have access to (filter by organization_id)
2. Check permissions on resources
3. Show their profile info
4. Track which app's global org they belong to (e.g., "vesta" org)

## See Also

- [Workspaces](./workspaces.md) — How workspaces reference WorkOS users/orgs
- [Permissions](../access/permissions.md) — Permission model (subjects include WorkOS users/orgs)

## Future: Sharing Attributes Across Apps (Migration Path)

**Current state (Phase 1):** All vesta-specific attributes live in vesta DB. WorkOS stores only identity (name, email, roles, org membership).

**Future possibility:** If textile, mia.cx, or other apps need access to vesta attributes without hitting vesta API (to avoid `textile → workos → textile → vesta api → textile` chains), you can migrate selected attributes to WorkOS custom attributes.

**Migration process:**

### Phase 1: One-time Export

```bash
# Export vesta-specific data from vesta DB
SELECT user_id, genre, avatar_url, bio FROM user_profiles;

# Bulk import to WorkOS via API (batch operation)
for each row:
  workos.users.update(user_id, {
    custom_attributes: {
      vesta_genre: row.genre,
      vesta_avatar_url: row.avatar_url,
      vesta_bio: row.bio
    }
  })
```

### Phase 2: Dual-Write Transition

Update vesta write handlers to sync to both DB and WorkOS:

```typescript
// In user profile update handler
await db.update(userProfiles).set({
  genre: "pop",
  avatar_url: "https://...",
})

// Also sync to WorkOS custom attributes
await workos.users.update(user_id, {
  custom_attributes: {
    vesta_genre: "pop",
    vesta_avatar_url: "https://...",
  },
})
```

Duration: 1-2 weeks (monitor for sync failures).

### Phase 3: Switch Reads

Gradually move read paths from vesta DB to WorkOS:

```typescript
// Before:
const genre = userProfile.genre

// After:
const genre = profile.customAttributes.vesta_genre
```

### Phase 4: Cleanup

Once textile/other apps confirm they're reading from WorkOS, drop the vesta DB columns and remove dual-write logic.

**Effort estimate:** ~1 day of engineering work across phases.

**When to do this:** Only if you confirm cross-app attribute sharing is worth the complexity. Otherwise, keep the current architecture (app-specific DBs, optional cross-app API calls).
