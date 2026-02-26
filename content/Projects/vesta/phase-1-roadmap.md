---
title: Phase 1 Roadmap (Blogging + Smart Links)
description: vesta Phase 1 scope, feature tiers, and out-of-scope items
---

# Phase 1 Roadmap: Blogging + Smart Links

**Goal:** Get creators using vesta to announce releases and let fans find music with zero friction.

## Phase 1 Scope

### In Scope

- **Creator profiles** — Customizable appearance via theming (colors, fonts, layout)
- **Blogging engine** — Post-based updates and release announcements
- **Smart links** — Multi-DSP redirects (Spotify, Apple Music, SoundCloud, YouTube, Bandcamp, etc.)
- **User engagement** — Like, comment, repost, subscribe on posts
- **Collections** — Curated lists of posts; users can follow collections
- **Pricing** — Free tier + modular pricing model

### Out of Scope (Phase 2+)

- Pre-save, scheduled posts
- Analytics, ad integrations
- Streaming, merch, commerce
- Collaboration tools (team commenting, drafts, workflows)
- Custom domains, vanity URLs
- Mobile apps
- Thread/conversation system

## Feature Tiers (Pricing & Gating)

Assign every feature a tier **before coding**. This drives pricing and which features are trial vs. paid.

Consult [[./feature-catalog.md]] for the complete list of features with pricing and COO details.

| Tier | Features | Trial? | Notes |
|------|----------|--------|-------|
| **Free** | Profiles, posts, smart links, basic collections, user engagement (like/comment/repost/follow) | Yes, always | Always-available tier; attracts users |
| **Basic** | Custom domain, basic analytics (views, traffic source) | No, paid-only | Entry paid tier; modest operational cost |
| **Pro** | Advanced analytics (geography, device, conversion funnel), ad integrations | No, paid-only | For serious creators; higher compute cost |
| **Enterprise** | Team accounts, high storage/bandwidth SLA, priority support | No, paid-only | For labels/collectives; sales-driven |

**When adding a feature:**
1. Assign a tier
2. Document feature gating in code (e.g., `if (user.tier === 'pro') { showAdvancedAnalytics() }`)
3. Link to [[./feature-catalog.md]] in PRs

## Decision Log

### Why REST, Not GraphQL (Phase 1)?

D1 bindings work best with minimal overhead. GraphQL adds query parsing, planning, and execution complexity that negates the latency advantage of direct database bindings. REST is simpler to deploy and reason about for Phase 1.

**GraphQL Deferred to Phase 3+** when Erato becomes a separate HTTP service or targets a managed database (PlanetScale, Convex, SpaceTimeDB).

### Why Monolithic App?

`apps/vesta` handles profiles, posts, links, feeds, admin. One codebase, one deployment. Separate only if a feature has fundamentally different scaling needs (e.g., real-time notifications → separate service later).

### Creator Identity is Core

The vesta design system must support extensive customization (colors, fonts, layout). Never hard-code appearance. Every creator should feel ownership of their page.

## Evaluating New Features

**Before implementing:**

1. **Is it Phase 1 scope?** Check the "In Scope" list above.
2. **If not in scope** — Defer to Phase 2+ or open a backlog issue; don't code it.
3. **If in scope** — Assign a pricing tier.

## See Also

- [[./feature-catalog.md]] — Complete feature list with pricing
- [[./feature-access-gating.md]] — Feature gating and access control
- [[./pricing-modular.md]] — Modular pricing model and discount curve
- [[./development-checklist.md]] — PR guidelines for Phase 1 development
- [[/../../apps/vesta/index.md]] — vesta app docs
- [[/../../apps/erato/index.md]] — Erato data layer docs
