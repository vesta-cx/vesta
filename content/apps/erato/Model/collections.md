---
title: Collections
description: Curated lists of resources; user-created playlists and collections
---

# Collections

Collections are curated lists of resources, users, workspaces, or other collections. Users create collections (like playlists on Spotify) to organize, share, and curate content. Collections also serve as feeds with fine-grained engagement visibility control.

Phase 1 focuses on basic curation and protected collections (reposts, following, likes, bookmarks). Advanced features (DSP syncing, collaborative collections) deferred to later phases.

## Overview

Collections let users:
- Create custom curated lists ("My Favorites", "Workout Bangers", "Female-fronted Synth Pop")
- Follow other users' collections (see them in feed)
- Auto-populate from engagements (reposts, follows, likes, bookmarks)
- Filter visibility of engagement types and content types within their collections

## Schema

```
collections:
id                   UUID primary key
owner_type           'user' | 'workspace'
owner_id             string (WorkOS user/workspace ID)
name                 string ("My Favorites", "Reposts", "Following", etc.)
description          text (optional)
type                 string ('following' | 'reposts' | 'likes' | 'comments' | 'bookmarks' | 'subscriptions' | 'notifications' | 'custom' | ...)
is_protected         boolean (protected collections cannot be deleted without deleting account)
visibility           'public' | 'private' | 'followers-only' (who can see this collection)
created_at           timestamp
updated_at           timestamp
```

**Protected collections** (auto-generated):
- `following` — Workspaces/collections a user follows
- `reposts` — Resources a user reposted
- `likes` — Resources a user liked
- `bookmarks` — Resources a user bookmarked
- `subscriptions` — Workspaces a user has subscription access to
- `comments` — Resources the user has commented on
- `notifications` — Hidden by default, queries engagements table for mention/comment threads

Users cannot delete protected collections.

### Collection Items

```
collection_items:
collection_id        UUID (FK → collections.id)
item_type            'resource' | 'user' | 'workspace' | 'collection'
item_id              UUID | string (resource UUID or WorkOS ID)
added_at             timestamp
position             integer (optional, for custom sort)
primary key          (collection_id, item_type, item_id)
```

Collection items can be:
- **Resource** — A post, song, album, or other resource
- **User** — An individual creator or listener
- **Workspace** — A label, artist collective, or publisher
- **Collection** — Another collection (enables nested/meta-collections)

### Collection Visibility & Filtering

```
collection_visibility_settings:
collection_id        UUID (FK → collections.id)
engagement_type      'like' | 'comment' | 'repost' | 'subscribe' | 'mention' | 'bookmark' | 'follow' | 'all'
is_visible           boolean (true = show this action type in this collection)
primary key          (collection_id, engagement_type)
```

Users can control which engagement types are visible in their collections. Examples:
- "Show me only songs from [label X], hide blog posts"
- "Show me [artist Y]'s releases, but hide their reposts"
- "Follow [curator Z] for everything except mentions"

```
collection_item_filters:
collection_id        UUID (FK → collections.id)
item_type            'resource' | 'user' | 'workspace' | 'collection'
item_id              UUID | string (optional; if null, applies to all items of this type)
engagement_action    'like' | 'comment' | 'repost' | 'subscribe' | 'mention' | 'bookmark' | 'all'
is_visible           boolean (true = show engagements of this type for this item)
primary key          (collection_id, item_type, item_id, engagement_action)
```

Per-item granularity: "Turn off seeing comments for [user X], but show everything else."

**Note:** Filters only apply to item types that can perform actions (resource: no actions; user/workspace: all actions).

## Protected Collections

These are auto-created and auto-managed. Users cannot delete them (only via account deletion).

| Type | Created | Auto-populated | Visibility |
| --- | --- | --- | --- |
| `following` | On first follow | Engagement: `follow` | Public (configurable) |
| `reposts` | On first repost | Engagement: `repost` | Public (configurable) |
| `likes` | On first like | Engagement: `like` | Private by default |
| `bookmarks` | On first bookmark | Engagement: `bookmark` | Private by default |
| `subscriptions` | On first subscribe | Engagement: `subscribe` | Public (configurable) |
| `comments` | On first comment | Engagement: `comment` | Private by default |
| `notifications` | On account creation | Queries `engagements` table | Hidden (read-only) |

## Phase 1 Scope

- Users can create custom collections (type: `'custom'`)
- Users can view/follow other users' collections (appear in feed)
- Protected collections auto-created on first engagement
- Collections are read-only from non-owner (can view, can't edit)
- Basic engagement filtering (show/hide action types per collection)
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

## See Also

- [[./engagements.md]] — Engagements auto-populate collections
- [[./Resource.md]] — Resources in collections
