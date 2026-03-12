---
title: Federation Roadmap
description: Long-term plan for protocol adapters (ActivityPub, AT Protocol, others) so vesta feeds and collections can participate in the fediverse.
---

# Federation Roadmap

## Goal

Enable vesta to participate in the fediverse so creators’ feeds and collections can be followed, discovered, and updated across protocol boundaries. The data model is **protocol-agnostic**; we support federation via **adapters** for multiple protocols rather than baking one protocol into the core.

## Why Adapters?

- **Collections and permissions are already abstract.** Collections (typed feeds: following, reposts, likes, bookmarks, subscriptions, custom), collection items (ordered, typed refs to resources/users/workspaces/collections), and permissions (subject × object × action) map cleanly to:
  - **ActivityPub:** `OrderedCollection` / `Collection`, Follow, Add/Remove, inbox delivery.
  - **AT Protocol:** Feed generators (collection → list of post refs), lists (collection membership), repo records.
- **One core model, many protocols.** We keep a single source of truth in D1; each federation protocol gets an adapter that translates our API and data into that protocol’s format and semantics. New protocols (or future iterations of AP/AT) can be added without changing the core schema.

## Target Protocols (Long Term)

| Protocol        | Adapter role                                                                  | Notes                                               |
| --------------- | ----------------------------------------------------------------------------- | --------------------------------------------------- |
| **ActivityPub** | Expose collections as AS2 `OrderedCollection`; Follow = subscribe; inbox Send | Mastodon/Fediverse compatible; stable, widely used  |
| **AT Protocol** | Feed generator (collection → feed view); optional list sync                   | Bluesky; repo/list model differs but maps to ours   |
| **Others**      | TBD                                                                           | Leave room for future protocols (e.g. other specs)  |

## Prerequisites (from existing roadmap)

- **Stable, public URIs** for collections (and items) so remote servers can reference and fetch them.
- **Phase 4 (Public Sign-Up & Network Effects)** in place: feeds, follows, collections as first-class products so “subscribe to this feed” has clear semantics and UX.

## Scope (when we get there)

- **Adapter layer:** Per-protocol modules that implement:
  - Outbound: serialize our collections/items/actors into the protocol’s format (e.g. JSON-LD for AP, Lexicon for AT).
  - Inbound: accept incoming activities (Follow, Like, Add, etc.), validate, and translate into our mutations (collection items, permissions, engagements).
- **Discovery and delivery:** For AP: webfinger, actor documents, inbox/outbox; for AT: feed generator endpoints, PDS-compatible APIs as needed.
- **No core schema change for “federation” per se.** The existing collections + permissions model stays; adapters are the only place that speak ActivityPub or AT.

## Non-goals (for this roadmap)

- Replacing our data model with a protocol-native one (e.g. we don’t become “AT Protocol repos” or “AP-only”).
- Supporting every federation edge case in v1; start with one protocol (likely ActivityPub), then add AT and others.

## See Also

- [Collections](../../packages/db/model/collections/collections.md) — Core collection types and semantics
- [Milestone 1 Roadmap (Blogging + Smart Links)](./milestones.md) — Phase 1 scope; [README Roadmap](../../../../README.md) Phase 4/5+ for network effects and long-term features
