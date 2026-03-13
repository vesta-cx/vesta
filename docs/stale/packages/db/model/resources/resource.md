---
title: Resource
description: Generic creative work model (posts in Phase 1; songs, albums in future phases)
---

<!-- @format -->

# Resource

A Resource is a creative work. In Phase 1, resources are posts, songs, albums. Later phases add artwork, etc.

Resources are owned by a **resource owner** (user or organization) and can be authored by **users** or **workspaces** via the unified authors table.

## Core Fields (Barebones)

```
resources table (base for all types):
id                   UUID primary key
owner_type           'user' | 'organization'
owner_id             string (WorkOS user/org ID)
type                 'post' | 'song' | 'album' | 'status' | ... (extensible)
title                string (optional for status type)
excerpt              string (160-320 chars, preview text for feeds)
parent_resource_id   UUID nullable FK -> resources.id (direct parent for status threads)
status               'LISTED' | 'UNLISTED'
created_at           timestamp
updated_at           timestamp
```

## Status Threading (Closure Table)

Status-based comments use direct parent linkage on `resources` plus a closure table for recursive reads.

```
thread_parents:
resource_id          UUID FK -> resources.id (descendant status)
ancestor_id          UUID FK -> resources.id (any ancestor in chain)
depth                integer (1 = direct parent, 2 = grandparent, ...)
primary key          (resource_id, ancestor_id)
indexes              (ancestor_id, depth), (resource_id)
```

### Write Materialization Rule

When inserting a status with `parent_resource_id`:

1. Query `thread_parents` where `resource_id = direct_parent_id` to fetch all ancestors.
2. Copy those rows for the new resource with `depth + 1`.
3. Insert one direct-parent row: `(new_resource_id, direct_parent_id, 1)`.

Depth for the new resource is derivable as `COUNT(*)` (or `MAX(depth)`) for the new resource in `thread_parents`.

### Query Patterns

```sql
-- All descendants under any resource (any depth)
SELECT tp.resource_id
FROM thread_parents tp
WHERE tp.ancestor_id = {resource_id}
ORDER BY tp.depth ASC;

-- Direct replies only
SELECT r.*
FROM resources r
WHERE r.parent_resource_id = {resource_id}
ORDER BY r.created_at ASC;
```

## Authors (Users & Workspaces)

Resources can be authored by **users** or **workspaces**:

```
resource_authors table (unified authors):
resource_id          UUID foreign key → resources.id
author_type          'user' | 'workspace'
author_id            UUID | string (user_id or workspace_id)
role                 string (optional: 'composer', 'performer', 'creator', etc.)
added_at             timestamp
primary key          (resource_id, author_type, author_id)
```

**Purpose:**

- **Workspaces:** Collaborative posts, remix credits (multiple workspaces on one resource)
- **Users:** User-created status updates (microblog posts, fan posts)

**Query pattern:**

```sql
SELECT r.*, ra.author_type, ra.author_id FROM resources r
JOIN resource_authors ra ON r.id = ra.resource_id
WHERE r.id = {resource_id};
```

## Type-Specific Extension Tables

### Phase 1: Posts

```
posts table (extends resources):
resource_id          UUID primary key, foreign key → resources.id
body                 text
body_html            text (optional, pre-rendered)
featured_image       string (URL, optional)
```

### Phase 2+: Songs, Albums

**To be added:**

```
songs table:
resource_id          UUID primary key, foreign key → resources.id
duration             integer (seconds)
genre                string (indexed)
release_date         date
isrc                 string (optional)
audio_url            string (optional)

albums table:
resource_id          UUID primary key, foreign key → resources.id
release_date         date
cover_art_url        string (optional)
```

## Why Type-Specific Tables

- **Typed fields:** All columns are strongly typed, not JSON
- **Queryable:** `SELECT * FROM songs WHERE genre = 'pop'` is efficient
- **Indexable:** Create indexes on type-specific fields
- **Unified base:** All resources share `resources.id`, so permissions, collections, engagement work uniformly
- **Minimal overhead:** 1:1 FK to base table, no junction tables

When querying a resource with its type details:

```
SELECT r.*, p.body, p.featured_image
FROM resources r
LEFT JOIN posts p ON r.id = p.resource_id
WHERE r.id = {resource_id}
```

## Status & Permissions

**Status controls listing:**

- `UNLISTED` — Not on workspace profile, visible via link/collections
- `LISTED` — Visible on workspace profile, in feeds

**Permissions control access:**

- Separate from status
- See [Permissions](../access/permissions.md) for full model

## Types (Extensible)

Phase 1: `'post'` (workspace), `'status'` (user microblog)

Future: `'song'`, `'album'`, `'artwork'`, `'press-release'`, etc.

Store in `type` field. Each type gets its own extension table (see above).

**Status Type (User Microblog):**

- Owned and authored by users
- Body: `excerpt` field (max 300 chars, like Bluesky)
- Media: Up to 4 images OR 1 video (stored separately, see Phase 1 note below)
- No title field (microblog style)

### Type Relationships (Phase 2+)

Albums contain songs via the `album_songs` junction table:

```
album_songs:
album_resource_id    UUID (FK → albums.resource_id)
song_resource_id     UUID (FK → songs.resource_id)
track_number         integer (position on album, 1-indexed)
primary key          (album_resource_id, song_resource_id)
```

A song can appear on multiple albums (compilations, reissues, etc.).

## See Also

- [Post Resource Type](./types/posts.md) — Post type (Phase 1)
- [songs](./types/songs.md) — Song type (Phase 2+)
- [albums](./types/albums.md) — Album type (Phase 2+)
- [Teams](../identity/teams.md) — Permissions subjects
- [Permissions](../access/permissions.md) — Access control
- [Workspaces](../identity/workspaces.md) — Workspaces (artist profiles that author resources)
