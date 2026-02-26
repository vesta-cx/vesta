---
title: URL Structure
description: vesta URL hierarchy and reserved routes
---

# URL Structure

vesta uses a clean, predictable URL hierarchy centered around workspaces and a creator dashboard.

## Subdomains

| Subdomain         | Purpose              | Notes                                                    |
| ----------------- | -------------------- | -------------------------------------------------------- |
| `vesta.cx`        | Main app             | Public profiles, resources, discovery, creator dashboard |
| `docs.vesta.cx`   | Help & documentation | User guides, tutorials, FAQ, knowledge base              |
| `status.vesta.cx` | Status page          | Platform health; separate infrastructure from main app   |

## Main App Routes (`vesta.cx`)

### Authentication & User Account

| Path        | Purpose               |
| ----------- | --------------------- | ------------------------------------------------------------------- |
| `/auth`     | Authentication flows  | Login, signup, SSO callbacks, logout                                |
| `/settings` | User account settings | Email, password, privacy, auth preferences (not workspace-specific) |
| `/me`       | Redirect to dashboard | Entry point for authenticated users                                 |

### Creator Dashboard

| Path         | Purpose           |
| ------------ | ----------------- | ------------------------------------------------------------------- |
| `/dashboard` | Creator workspace | Manage workspaces, create/edit resources, profile editing, settings |

### Public Workspaces & Resources

| Path | Purpose |
|------|---------|
| `/[workspace]` | Workspace profile | Public-facing workspace homepage (shows default feed/collection) |
| `/[workspace]/[resource-slug]` | View resource | Post, song, album, or other resource type |
| `/[workspace]/c/[collection-slug]` | Workspace collection | Specific collection owned by this workspace (shareable link, e.g., artist roster, discography) |
| `/[workspace]/following` | Following list | Alias for `/[workspace]/c/following` |
| `/[workspace]/followers` | Followers list | Alias for `/[workspace]/c/followers` |

### Collections (Centralized)

| Path | Purpose |
|------|---------|
| `/collections/[slug]` | View collection | Any collection, regardless of owner |
| `/[workspace]/collections` | Workspace's collections | List/index of collections owned by this workspace |

**Note:** Built-in collections (`following`, `followers`, etc.) are accessible via shorthand aliases (`/[workspace]/following`, `/[workspace]/followers`) for convenience, but the canonical paths are `/[workspace]/c/[collection-slug]`.

### User Profiles

| Path               | Purpose      |
| ------------------ | ------------ | --------------------------------------------------- |
| `/user/[username]` | User profile | Shows user's created collections, follows, activity |

### Discovery & Exploration

| Path | Purpose |
|------|---------|
| `/discover` | Personalized discovery | For logged-in users; algorithmic/personalized feed |
| `/explore` | Public browsing | For all users; curated/trending content |
| `/search` | Global search | Search workspaces, resources, users, collections |
| `/notifications` | Notifications | User's notification feed (authenticated only) |

### System Routes

| Path     | Purpose            |
| -------- | ------------------ | --------------------------------------------------------- |
| `/api`   | REST API           | `/api/v1/resources`, `/api/v1/engagements`, etc.          |
| `/about` | About vesta        | Mission, team, vision                                     |
| `/legal` | Legal policies     | Terms of service, privacy policy, cookie policy           |
| `/help`  | Support & feedback | Support tickets, contact, feedback form                   |
| `/admin` | Admin panel        | Internal/staff only; moderation, analytics, system health |

## Reserved Slug Patterns

The following **cannot be used as workspace slugs** (reserved by system):

```
auth, api, about, help, legal, admin, me, settings, dashboard, discover, explore, collections, user, feed, notifications, search, c
```

## URL Hierarchy Examples

**Workspace profile (public):**
```
vesta.cx/daybreak
```

**Resource within workspace:**
```
vesta.cx/daybreak/new-release-2026
```

**Workspace's collection (e.g., artist discography, label roster):**
```
vesta.cx/daybreak/c/all-singles
```

**Workspace followers:**
```
vesta.cx/daybreak/c/followers
```

**Search:**
```
vesta.cx/search?q=lo-fi
```

**Notifications:**
```
vesta.cx/notifications
```

**Centralized collection:**
```
vesta.cx/collections/lo-fi-beats
```

**User profile:**
```
vesta.cx/user/alex
```

**Creator dashboard:**
```
vesta.cx/dashboard
```

**User account settings:**
```
vesta.cx/settings
```

**API endpoint:**
```
vesta.cx/api/v1/resources
vesta.cx/api/v1/engagements
```

---

## Implementation Notes

- **Workspace slugs** — Case-insensitive, alphanumeric (e.g., `daybreak`, `label-123`); reserved slugs should be rejected at signup
- **404 handling** — Workspace not found → return 404 (not 500)
- **Redirect strategy** — `/me` always redirects to `/dashboard` (authenticated users only)
- **Profile editing** — Users edit their own profile by visiting their workspace URL and using dashboard editor
- **Workspace management** — All workspace operations (rename, avatar, resources, collections) happen in `/dashboard`
- **Subdomain decision** — `/dashboard` vs `dash.vesta.cx` still to be decided (similar separation strategy as `docs.vesta.cx` and `status.vesta.cx`)
