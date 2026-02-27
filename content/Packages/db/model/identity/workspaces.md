---
title: Workspaces
description: Publishing entities (artists, labels, curators, etc.) separate from user logins
---

# Workspaces

Workspaces are publishing entities. artists, labels, curators, or any creative entity. They are separate from user logins, similar to how YouTube separates Google Accounts (users) from YouTube Channels (workspaces), and how Bandcamp separates fan pages (users) from artist pages (workspaces).

## Purpose

- **Artists/Producers** — Own their discography, release announcements
- **Labels/Publishers** — Manage multiple artists, team-based curation
- **Curators** — Maintain public collections and recommendations
- **News/Press** — Publish updates and announcements

## Schema

```
workspaces:
id                   UUID primary key
name                 string (workspace name: "Glassnote Records", "Taylor Swift")
slug                 string (URL-safe identifier, unique)
description          text (optional, bio/mission statement)
owner_type           'user' | 'organization'
owner_id             string (WorkOS user/org ID)
avatar_url           string (R2 or Gravatar URL, optional)
banner_url           string (R2 URL for profile banner, optional)
visibility           'public' | 'private'
created_at           timestamp
updated_at           timestamp
```

## Ownership

Workspaces are owned by a **user** or **organization**, not directly by WorkOS orgs. This allows:

- Multiple workspaces per user (e.g., "Taylor Swift" and "Production Co")
- Organizational ownership (label owns official workspace)
- Team-based management (see [Teams](./teams.md))

## Workspace Authors

When a workspace publishes resources, it is an author. See [Resource](../resources/resource.md#authors) for the unified `resource_authors` table.

## Workspace Resources

A workspace can own resources. See [Resource](../resources/resource.md) for the resource model and ownership.

## Permissions

Workspaces are permission **objects**. Users and teams can have permissions on workspaces:

- `read` — View public profile
- `write` — Edit workspace metadata, create resources
- `delete` — Delete the workspace
- `admin` — Full control including team management

See [Permissions](../access/permissions.md) for the permission model.

## See Also

- [Resource](../resources/resource.md) — Resources owned/authored by workspaces
- [Permissions](../access/permissions.md) — Workspace access control
- [Teams](./teams.md) — Team-based workspace management
