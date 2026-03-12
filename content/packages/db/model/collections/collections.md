---
title: Collections
description: Curated lists of resources; user-created playlists and collections
---

# Collections

Collections are curated lists of resources, users, workspaces, or other collections. Users create collections (like playlists on Spotify) to organize, share, and curate content. Collection visibility is determined by the **permissions** table (who can see the collection) and **collections.status** (LISTED | UNLISTED); there is no separate visibility-settings table.

Phase 1 focuses on basic curation and protected collections (reposts, following, likes, bookmarks). Advanced features (DSP syncing, collaborative collections) deferred to later phases.

## Overview

Collections let users:

- Create custom curated lists ("My Favorites", "Workout Bangers", "Female-fronted Synth Pop")
- Follow other users' collections (see them in feed)
- Auto-populate from engagements (reposts, follows, likes, bookmarks)
- Filter what they see from items in a collection (e.g. only songs from this artist, only statuses) via collection_item_filters

## Schema

```
collections:
id                   UUID primary key
owner_type           'user' | 'workspace'
owner_id             string (WorkOS user/workspace ID)
name                 string ("My Favorites", "Reposts", "Following", etc.)
description          text (optional)
type                 string ('resources' | 'following' | 'reposts' | 'likes' | 'comments' | 'bookmarks' | 'subscriptions' | 'notifications' | 'custom')
is_protected         boolean (protected collections cannot be deleted without deleting account)
status               'LISTED' | 'UNLISTED'
created_at           timestamp
updated_at           timestamp
```

**Collection type semantics** (canonical definitions live in `@vesta-cx/db` [collection types](https://github.com/vesta-cx/vesta/blob/main/packages/db/docs/collection-types.md)):

- **Static types** (system-defined, at most one per owner, stored as rows): `resources`, `following`, `reposts`, `likes`, `bookmarks`, `subscriptions`, `comments`. Protected (users cannot delete). `resources` = canonical “all resources” of the owner; resource visibility there respects `resources.status` (LISTED only).
- **Virtual (no collection row):** `notifications` — Inbox-style view (mentions, replies, etc.) backed by a **query on the `engagements` table**, not by a row in `collections` or `collection_items`. The product may present it as a "collection" in the UI, but there is no corresponding collection row.
- **Manual type:** `custom` — user-created lists; items explicitly added; UNLISTED resources may appear.

Users cannot delete protected (static) collections.

### Collection Items

```
collection_items:
collection_id        UUID (FK → collections.id)
item_type            'resource' | 'collection'
kind                 'user' | 'workspace'
item_id              UUID | string (resource UUID or WorkOS ID)
added_at             timestamp
position             integer (optional, for custom sort)
primary key          (collection_id, item_type, item_id)
```

Collection items can be:

- **Resource** — A post, song, album, or other resource
- **Collection** — Another collection (enables nested/meta-collections)

**Kind (when item is a collection):** When the referenced collection is an actor’s feed (user or workspace), `user` and `workspace` are functionally the same: “this item is a feed owned by an actor.” A single term for that union in APIs/schema (e.g. a `kind` field or convention) is `**actor`** — requires one line in docs: “`kind === 'actor'` means the collection is an actor’s feed (user or workspace).” Alternative: verbose `**user_or_workspace**` if you prefer no new concept.

### Collection visibility

Whether a collection is visible to a given viewer is determined by:

- **permissions** — Who has read access to the collection (see [Permissions](../access/permissions.md)).
- **collections.status** — `LISTED` (discoverable on profile/feeds) or `UNLISTED` (only via direct link for those with read permission).

There is no separate `collection_visibility_settings` table. Same model as `resources`.

### Collection item filters

**collection_item_filters** let the **collection owner** control what they see from each item *in* that collection. For example:

- "Only show songs from [artist X], hide their blog posts"
- "Only show statuses from [collection Y]"
- "Show [workspace Z]'s releases but hide their reposts" (filter by engagement action)

```
collection_item_filters:
collection_id        UUID (FK → collections.id)
item_type            'resource' | 'user' | 'workspace' | 'collection'
item_id              UUID | string (optional; if null, applies to all items of this type)
engagement_action    'like' | 'comment' | 'repost' | 'subscribe' | 'mention' | 'bookmark' | 'follow' | 'all'
is_visible           boolean (true = show engagements of this action for this item)
primary key          (collection_id, item_type, item_id, engagement_action)
```

Filters only apply to item types that can produce engagements (user, workspace, collection). Resources do not perform actions; filtering by action applies to what the collection owner sees from followed users/workspaces/collections.

## Protected Collections

These are auto-created and auto-managed. Users cannot delete them (only via account deletion).


| Type            | Created            | Auto-populated          |
| --------------- | ------------------ | ----------------------- |
| `following`     | On first follow    | Engagement: `follow`    |
| `reposts`       | On first repost    | Engagement: `repost`    |
| `likes`         | On first like      | Engagement: `like`      |
| `bookmarks`     | On first bookmark  | Engagement: `bookmark`  |
| `subscriptions` | On first subscribe | Engagement: `subscribe` |
| `comments`      | On first comment   | Engagement: `comment`   |


**Note:** `notifications` is not a stored collection. It is a virtual view: the UI shows an inbox (mentions, replies, etc.) by querying `engagements` directly. No row in `collections` or `collection_items`. Tracking **read** vs **unread** for notification items would live in usage metrics / analytics (or a dedicated reads table), not in the collections scope.

Visibility for any *stored* collection is determined by permissions + `collections.status` (LISTED | UNLISTED).

## Phase 1 Scope

- Users can create custom collections (type: `'custom'`)
- Users can view/follow other users' collections (appear in feed)
- Protected collections auto-created on first engagement
- Collections are read-only from non-owner (can view, can't edit)
- Basic engagement filtering via collection_item_filters (what the owner sees from each item)
- Collections display in user's profile / workspace profile
- Follows of collections are themselves engagements (appear in follower's feed)

## Phase 2+

- Collaborative collections (multiple owners, edit permissions)
- Collection recommendations/discovery ("Popular collections you might like")
- Smart/curated collections (curators pick resources for themed collections)
- Syncing collections to DSP playlists (Spotify, Apple Music)
- Collection sharing/exporting

## Future Consideration: Algorithmic Collections

Phase 3+ may include algorithmic/curated collections generated by the system:

**Examples:**

- "Trending This Week" — Top resources by engagement
- "Recommended for You" — Personalized based on follows/likes
- "New Releases" — Latest posts from followed workspaces
- "Similar to X" — Resources similar to a given resource

**Implementation options:**

1. **Stored algorithmic collections** — Actual rows in `collections` table with `owner_type: 'system'`, periodically regenerated
2. **Virtual/computed collections** — Pure backend queries, no DB row, rendered as collections on frontend

Schema extension (if storing):

```
collections (Phase 3+ additions):
owner_type           'user' | 'workspace' | 'system'
algorithm            'trending' | 'recommended' | 'new-releases' | null
regenerated_at       timestamp (last refresh)
refresh_interval     integer (hours, optional)
```

Decision deferred to Phase 3 pending actual usage patterns and performance needs.

## Notes & roadmap

- **TODO: Recursive collections** — Collections can contain other collections (`item_type = 'collection'`). Optimize DB queries (e.g. recursive CTEs, materialized paths, or bounded-depth expansion) for feed and membership lookups.

### Feed collection and following UX

- **Chosen approach: Flat following (no feed collection).** When a consumer follows a user/workspace, add that actor’s **resources** and **reposts** collections (and optionally others) as **separate items** to the consumer’s `following` collection. “Follow” can offer a dropdown: “Follow for: [x] Posts [x] Reposts [ ] Likes …”. No denormalized `feed` row; no recursive “resolve feed’s child collections” when building the homepage. Query: for each collection in following, get items; apply collection_item_filters. Most query-efficient and best UX. Document this in the API and feed-building logic.

## See Also

- [Engagements](./engagements.md) — Engagements auto-populate collections
- [Resource](../resources/resource.md) — Resources in collections
