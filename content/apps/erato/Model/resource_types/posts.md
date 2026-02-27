---
title: Post Resource Type
description: Blog-style content posts (Phase 1)
---

# Post Resource Type

Posts are the Phase 1 resource type. They're blog-style content—updates, release announcements, press releases—shared from a workspace.

## Schema

```
posts table (extends resources):
resource_id          UUID primary key, foreign key → resources.id
body                 text
body_html            text (optional, pre-rendered markdown)
featured_image       string (URL, optional)
```

## Fields

| Field | Type | Purpose |
|-------|------|---------|
| `resource_id` | UUID | Links to base `resources` table |
| `body` | text | Post content (markdown) |
| `body_html` | text | Pre-rendered HTML (optional, for performance) |
| `featured_image` | string | Hero image URL (optional) |

## Query Pattern

```sql
SELECT r.*, p.body, p.body_html, p.featured_image
FROM resources r
JOIN posts p ON r.id = p.resource_id
WHERE r.type = 'post' AND r.id = {resource_id};
```

## See Also

- [Resource](../resource.md) — Base resource model
- [Permissions](../permissions.md) — Who can view/edit posts
