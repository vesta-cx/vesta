---
title: Engagements
description: Generic engagement model for likes, comments, reposts, subscribes, mentions, bookmarks
---

# Engagements

Engagements are a subject–action–object model for **user interactions that already happened**. Unlike permissions (which govern what a subject *may* do), engagements record what a subject *did*.

- **Subject** — The entity that *performed* the action (user or workspace only).
- **Action** — The action that *was performed* (e.g. like, comment, repost, follow).
- **Object** — The entity that *was acted upon* (resource, workspace, collection, or user). Teams and organizations are not public-facing and do not appear as engagement objects.

See [packages/db Data Model](../index.md#permission-vs-engagement-subject-action-object) for comparison with permissions.

## Schema

```
engagements:
id                   UUID primary key
subject_type         'user' | 'workspace'
subject_id           string (WorkOS user ID/workspace ID)
action               'like' | 'comment' | 'repost' | 'follow' | 'subscribe' | 'mention' | 'bookmark'
object_type          'resource' | 'workspace' | 'collection' | 'user'
object_id            UUID (resource/workspace/collection ID)
created_at           timestamp
```

**Note:** "Subscribe" appears in two places:

1. **Engagements table** — For feed discovery and trust signals ("your friend subscribed to this creator")
2. **Subscriptions/billing table (Phase 3+)** — For access control and payment tracking

Don't confuse these. The engagement is public (appears in feeds). The billing relationship is private (payment/permissions).

## Actions

| Action      | Meaning                                     | Side Effects                                                         | Feed Visible |
| ----------- | ------------------------------------------- | -------------------------------------------------------------------- | ------------ |
| `like`      | Subject liked a resource                    | Auto-add to subject's "likes" collection                             | Optional     |
| `comment`   | Subject commented on a resource             | See engagement_comments table                                        | Optional     |
| `repost`    | Subject reposted (shared) a resource        | Auto-add to subject's "reposts" collection                           | Optional     |
| `follow`    | Subject followed a workspace/collection     | Auto-add to subject's "following" collection                         | Optional     |
| `subscribe` | User subscribed to a workspace (paid)       | Auto-add to user's "subscriptions" collection, create billing record | Optional     |
| `mention`   | Subject mentioned a resource/user/workspace | See engagement_mentions table (future: thread tracking)              | Optional     |
| `bookmark`  | Subject bookmarked a resource               | Auto-add to subject's "bookmarks" collection                         | Optional     |

### Follow vs. Subscribe (Important Distinction)

- **Follow** (free engagement action) — User adds workspace/collection to their "following" collection; free feature, low friction signal.
- **Subscribe** (paid engagement action) — User has paid for a workspace's subscription plan; high-trust endorsement, appears prominently in feeds, also creates billing/access relationship (Phase 3+).

Both populate feeds, but **subscribe is a stronger signal** because it's paid. Friends seeing "your pal subscribed to this creator" is powerful discovery.

## Engagement visibility & filtering

In UI, a subject can define which engagement types are visible to their followers. In the Data Model, this just touches the permissions table for each respective static "engagement" collection.

Visibility of engagements in feeds is controlled by **collection_item_filters** (see [Collections](./collections.md#collection-item-filters)): collection owners choose which **actions** (e.g. like, repost, comment) they see from each item in their collection. Subject (initiator) control and follower (consumer) control are both expressed via those filters.

## Comments (Sub-Model)

For comments, store the text separately:

```
engagement_comments:
engagement_id        UUID primary key, foreign key → engagement.id
text                 text (comment body)
created_at           timestamp (inherited from engagement, but can duplicate for convenience)
```

**Query pattern:**

```sql
SELECT e.*, ec.text FROM engagements e
JOIN engagement_comments ec ON e.id = ec.engagement_id
WHERE e.action = 'comment' AND e.object_id = {resource_id}
ORDER BY e.created_at DESC;
```

## Mentions (Sub-Model)

For mentions, store the mentioned entity separately:

```
engagement_mentions:
engagement_id        UUID primary key, foreign key → engagement.id
mentioned_type       'user' | 'workspace' | 'resource'
mentioned_id         string | UUID (WorkOS ID or resource UUID)
created_at           timestamp
```

**Future consideration:** Thread tracking system to group mentions and replies.

## Reposts & Collections

When a user reposts a resource:

1. Insert engagement record: `{ action: 'repost', subject_id: user_id, object_id: resource_id }`
2. Auto-add resource to user's "reposts" collection (or create it)

When a user follows a workspace/collection:

1. Insert engagement record: `{ action: 'follow', subject_id: user_id, object_type: 'workspace'|'collection', object_id: workspace/collection_id }`
2. Auto-add workspace/collection to user's "following" collection (or create it)

When a user bookmarks a resource:

1. Insert engagement record: `{ action: 'bookmark', subject_id: user_id, object_id: resource_id }`
2. Auto-add resource to user's "bookmarks" collection (or create it)

This makes all three queryable two ways:

- **Engagement table:** "Did user X follow workspace Y?" → `SELECT * FROM engagements WHERE action = 'follow' AND subject_id = X AND object_id = Y`
- **Collections table:** "What is user X following?" → Query user's "following" collection

See [Collections](./collections.md) for collection implementation.

## Indexes (TODO)

The `engagements` table is heavily read for counts, existence checks, and feed queries. **TODO:** Add indexes to support:

- Lookup by object: `(object_type, object_id, action)` for “how many likes on this resource?” and “who liked this?”
- Lookup by subject: `(subject_type, subject_id, action, created_at)` for “user X’s recent likes” and feed construction
- Existence: `(subject_type, subject_id, action, object_type, object_id)` for “did user X like resource Y?”

Review query patterns in Erato/vesta before finalizing index list; consider composite indexes that match the most common filters and sort orders.

## Query Examples

```sql
-- Get like count on a resource
SELECT COUNT(*) FROM engagements WHERE action = 'like' AND object_id = {resource_id};

-- Get comments on a resource (newest first)
SELECT e.*, ec.text FROM engagements e
JOIN engagement_comments ec ON e.id = ec.engagement_id
WHERE e.action = 'comment' AND e.object_id = {resource_id}
ORDER BY e.created_at DESC;

-- Get all likes by a user
SELECT * FROM engagements WHERE action = 'like' AND subject_id = {user_id}
ORDER BY created_at DESC;

-- Get all follows by a user
SELECT * FROM engagements WHERE action = 'follow' AND subject_id = {user_id}
ORDER BY created_at DESC;
```

## See Also

- [Collections](./collections.md) — Collections for reposts, follows, bookmarks, and custom curation
- [Permissions](../access/permissions.md) — Similar subject-action-object model for access control
