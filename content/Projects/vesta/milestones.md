---
title: Milestone 1 Roadmap (Blogging + Smart Links)
description: vesta Milestone 1 scope, feature tiers, and out-of-scope items
---

# Milestone 1 Roadmap: Blogging + Smart Links

**Goal:** Get creators using vesta to announce releases and let fans find music with zero friction.

## Milestone 1 Scope

### In Scope

- **Creator profiles** — Customizable appearance via theming (colors, fonts, layout)
- **Blogging engine** — Post-based updates and release announcements
- **Smart links** — Multi-DSP redirects (Spotify, Apple Music, SoundCloud, YouTube, Bandcamp, etc.)
- **User engagement** — Like, comment, repost, subscribe on posts
- **Collections** — Curated lists of posts; users can follow collections
- **Pricing** — Free tier + modular pricing model through Feature Access.

## Milestone 2: Pre-saves & Analytics

**Goal:** Enable creators to announce upcoming releases and understand their audience.

- **Pre-save campaigns** — Let users pre-save releases before they go live (on Spotify, Apple Music, etc.)
- **Scheduled posts** — Creators can schedule posts to go live at specific times
- **Basic analytics** — Post views, follower counts, engagement metrics (24h reporting)
- **Usage metrics** (admin) — Monitor platform health and adoption
- **Smart collections UI/UX** — Guided creation of filtered collections (e.g., discographies, genre-specific playlists); auto-creates "template"/"example" collections and walks creators through organizing their content automatically with filtered collections.

## Milestone 3: Marketing & Monetization

**Goal:** Self-sustaining platform; creators can run ads and earn from fans.

- **Advanced analytics** — Geography, device, conversion funnel breakdowns
- **Ad integrations** — Share analytics with Meta Ads, TikTok Ads, Google Analytics; retargeting campaigns
- **Custom domains & vanity URLs** — Let creators use their own domain (e.g., artist.com instead of vesta.cx/[artist])

**Platform is self-sustaining after Milestone 3 → Public beta signups begin.**

## Milestone 4+

- **Thread/conversation system** — Comment threading and conversations
- **Resource version history** — Audit trail for post edits
- **(Music) streaming & pre-order** — Host audio files, pre-order capabilities
- **Collaboration tools** — Team commenting, draft workflows, role-based editing
- **E-commerce** — Direct sales via Shopify integration or custom storefront
- **Collections advanced** — Collaborative collections, cross-platform playlist syncing
- **Mobile apps** — Native iOS/Android apps

## Feature Tiers (Pricing & Gating)

Assign every feature a tier **before coding**. This drives pricing and which features are trial vs. paid.

Consult [[./feature-catalog.md|Feature Catalog & Pricing Transparency]] for the complete list of features with pricing and COO details.

| Tier | Features | Trial? | Notes |
|------|----------|--------|-------|
| **Free** | Profiles, posts, smart links, basic collections, user engagement (like/comment/repost/follow) | Yes, always | Always-available tier; attracts users |
| **Basic** | Custom domain, basic analytics (views, traffic source) | No, paid-only | Entry paid tier; modest operational cost |
| **Pro** | Advanced analytics (geography, device, conversion funnel), ad integrations | No, paid-only | For serious creators; higher compute cost |
| **Enterprise** | Team accounts, high storage/bandwidth SLA, priority support | No, paid-only | For labels/collectives; sales-driven |

**When adding a feature:**
1. Assign a tier
2. Document feature gating in code (e.g., `if (user.tier === 'pro') { showAdvancedAnalytics() }`)
3. Link to [[./feature-catalog.md|Feature Catalog & Pricing Transparency]] in PRs

## Decision Log

### Why REST, Not GraphQL (Milestone 1)?

D1 bindings work best with minimal overhead. GraphQL adds query parsing, planning, and execution complexity that negates the latency advantage of direct database bindings. REST is simpler to deploy and reason about for Milestone 1.

**GraphQL Deferred to Milestone 3+** when Erato becomes a separate HTTP service or targets a managed database (PlanetScale, Convex, SpaceTimeDB).

### Why Monolithic App?

`apps/vesta` handles profiles, posts, links, feeds, admin. One codebase, one deployment. Separate only if a feature has fundamentally different scaling needs (e.g., real-time notifications → separate service later).

### Creator Identity is Core

The vesta design system must support extensive customization (colors, fonts, layout). Never hard-code appearance. Every creator should feel ownership of their page.

## Evaluating New Features

**Before implementing:**

1. **Is it Milestone 1 scope?** Check the "In Scope" list above.
2. **If not in scope** — Defer to Milestone 2+ or open a backlog issue; don't code it.
3. **If in scope** — Assign a pricing tier.

## See Also

- [[./feature-catalog.md|Feature Catalog & Pricing Transparency]] — Complete feature list with pricing
- [[./feature-access-gating.md|Feature Access & Gating]] — Feature gating and access control
- [[./pricing-modular.md|Modular Pricing & Weighted Discount Curve]] — Modular pricing model and discount curve
- [[./development-checklist.md|Development Checklist (Phase 1)]] — PR guidelines for Milestone 1 development
- [[/../../apps/vesta/index.md]] — vesta app docs
- [[/../../apps/erato/index.md]] — Erato data layer docs
