---
title: Erato
authors:
  - name: Mia
    url: https://github.com/mia-riezebos
description: Backend service and data model for Vesta
created: 2025-10-13T12:36:40+02:00
modified: 2025-10-22T20:08:11+02:00
license:
license_url:
---

Erato is the backend service and data model for Vesta. It manages users, organizations, workspaces (artist/label profiles), resources (creative works), engagements (interactions), collections (curated lists), and permissions.

## Architecture

### Phase 1 (Current)

Erato uses **Drizzle ORM** for type-safe database access with D1 (Cloudflare's SQLite service). Drizzle is lightweight, has excellent TypeScript support, and minimal setup overhead.

**Primary Database:** D1 (Cloudflare SQLite)

**Why REST, not GraphQL?** D1 bindings work best with minimal overhead. GraphQL adds query parsing, planning, and execution complexity that negates the latency advantage of direct database bindings. GraphQL is deferred to Phase 3+ when Erato becomes a separate HTTP service or targets a managed database (PlanetScale, Convex, SpaceTimeDB).

**Database Access:**
- **Phase 1-2:** Direct D1 bindings from apps (vesta app queries D1 directly via `packages/db`)
- **Phase 3+:** Erato as separate HTTP service with REST API
- **Migration path:** D1 → PlanetScale or other managed database as scaling demands grow

### Future Phases

Erato may become a dedicated HTTP service once:
1. A separate Worker with its own HTTP boundary, OR
2. Running against a managed database (PlanetScale, Convex, SpaceTimeDB)

## Data Model

### WorkOS Managed

- **Users** — Login identities managed by WorkOS AuthKit / SSO
- **Organizations** — Org membership and org-level resources

### Vesta Domain

- **Workspaces** — Artist or label profiles (publishing entities)
- **Resources** — Creative works (songs, albums, posts, status updates, etc.)
- **Resource Types** — Type-specific extensions (posts, songs, albums)
- **Resource URLs** — Smart links (DSP links, pre-orders, etc.)
- **Permissions** — RBAC: subject → object → action with precedence merging
- **Teams** — Groups within organizations for shared permissions
- **Engagements** — User interactions (likes, comments, reposts, follows, subscribes, mentions, bookmarks)
- **Collections** — Curated lists of resources/users/workspaces; includes protected auto-generated collections (following, reposts, likes, bookmarks, subscriptions, notifications)

## Key Tables

### Users & Auth

- **users** — WorkOS-synced user identities. See [Users & Organizations (WorkOS-Managed)](./Model/users.md).

### Organizations

- **organizations** — WorkOS org entities synced to Vesta. See [Organizations (WorkOS-Managed)](./Model/organizations.md).

### Teams

- **teams** — Groups for shared permissions within an organization. See [Teams](./Model/teams.md).

### Features & Subscriptions

- **features** — Feature metadata registry with pricing. See [Features & Subscriptions](./Model/features-subscriptions.md).
- **user_features** — Per-user feature entitlements with individual limits.
- **feature_pricing** — Pricing reference for discount curve (no tiers).
- **feature_presets** — UI-only preset bundles (free, basic, pro, enterprise).
- **user_subscriptions** — Subscription metadata and Stripe integration.
- **subscription_discounts** — Discount audit trail and analytics.

### Workspaces (Publishing Entities)

- **workspaces** — Artist/label profiles. See [Workspaces](./Model/workspaces.md).

### Resources (Creative Works)

- **resources** — Base table for all creative works (songs, albums, posts, status updates). See [Resource](./Model/Resource.md).
- **posts** — Blog-style content (Phase 1). See [Post Resource Type](./Model/resource_types/posts.md).
- **songs** — Individual tracks (Phase 2+).
- **albums** — Collections of songs (Phase 2+).
- **album_songs** — Junction table for many-to-many song-album relationships (Phase 2+).
- **resource_urls** — Smart links attached to resources (DSPs, pre-orders). See [Resource URLs (Smart Links)](./Model/resource_urls.md).
- **resource_authors** — Unified authors table (users and workspaces can author resources).

### Authorization

- **permission_actions** — Extensible registry of all actions. See [Permissions](./Model/Permissions.md).
- **permissions** — Subject-Object-Action matrix with allow/deny/unset values and precedence merging. See [Permissions](./Model/Permissions.md).

### Interactions

- **engagements** — User interactions (likes, comments, reposts, follows, subscribes, mentions, bookmarks). See [Engagements](./Model/engagements.md).
- **engagement_comments** — Comment text for comment engagements.
- **engagement_mentions** — Mentioned entities for mention engagements.

### Collections (Curated Lists)

- **collections** — Curated lists with protected auto-generated types (following, reposts, likes, bookmarks, subscriptions). See [Collections](./Model/collections.md).
- **collection_items** — Items in collections (resources, users, workspaces, other collections).
- **collection_visibility_settings** — Per-collection engagement type visibility.
- **collection_item_filters** — Per-item engagement type visibility.

## Next Steps

See detailed documentation in the `Model/` directory for each entity.
