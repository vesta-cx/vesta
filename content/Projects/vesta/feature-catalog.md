---
title: Feature Catalog & Pricing Transparency
description: Complete list of all vesta features with cost of operation, base pricing, margins, and descriptions
---

# Feature Catalog & Pricing Transparency

Complete breakdown of vesta features: what it costs to operate, what we charge, and why. This is the source of truth for pricing decisions and public transparency.

**Organization:**

- **Real Features** — Modeled, schemad, and ready for implementation.
- **Future Features** - Long-term planned or brainstorm features.
- **Example Features** — Fake data for example purposes.

**Legend:**

- **Feature** — Feature name and slug
- **Category** — Type of feature (identity, content, discovery, analytics, admin)
- **Progress** — Implementation status: `planned`, `modeled`, `in-progress`, `implemented`, `live`
- **COO** — Cost of Operation (monthly per user; includes infra, support, third-party APIs)
- **Base Price** — Retail price (no discount applied)
- **Margin %** — (Base - COO) / Base; target is 30-40% with max discount curve at 20%
- **Description** — What the feature does

---

## Live features

These features have been implemented and are live on vesta.

- N/A

---

## Planned features (Coming Soon)

These features have been modeled in the data layer and are ready for implementation.

| Feature            | Category  | Progress | COO | Base Price | Margin | Description                                                                       |
| ------------------ | --------- | -------- | --- | ---------- | ------ | --------------------------------------------------------------------------------- |
| Features           | admin     | modeled  | N/A | $0         | N/A    | System for managing feature access, powering our modular subscriptions.           |
| Claim feature      | admin     | planned  | N/A | $0         | N/A    | Self-assign any feature for testing/admin purposes (QA only)                      |
| Creator profiles   | identity  | modeled  | N/A | $0         | N/A    | Workspace profile page with customizable bio                                      |
| Profile images     | identity  | modeled  | N/A | $0         | N/A    | Avatar & banner upload with image processing & transcoding                        |
| Blogging engine    | content   | modeled  | N/A | $0         | N/A    | Create, edit, publish resources (posts, status updates, etc.)                     |
| Song resources     | content   | planned  | N/A | $0         | N/A    | Create resources of type "song"                                                   |
| Song audio         | content   | planned  | N/A | $0         | N/A    | Add audio files to resources of type "song"                                       |
| Smart links        | discovery | modeled  | N/A | $0         | N/A    | Add external links to multiple DSPs (Spotify, Apple, SoundCloud, etc.)            |
| Collections        | discovery | modeled  | N/A | $0         | N/A    | Create curated lists of posts                                                     |
| Engagement (basic) | discovery | modeled  | N/A | $0         | N/A    | Like, repost & leave comments on resources, follow collections (users/workspaces) |
| Notifications      | discovery | modeled  | N/A | $0         | N/A    | View other users' engagement on your resources, workspaces & collections          |

## Planned features (Long-term)

| Feature        | Category  | Progress | COO | Base Price | Margin | Description                                                      |
| -------------- | --------- | -------- | --- | ---------- | ------ | ---------------------------------------------------------------- |
| Subscribes     | discovery | planned  | N/A | N/A        | N/A    | Users can pay to subscribe to your workspace                     |
| Email support  | support   | planned  | N/A | N/A        | N/A    | Standard email support (24-48h response)                         |
| Usage metrics  | admin     | planned  | N/A | N/A        | N/A    | Gain insight into which features generate the most traffic.      |
| COO monitoring | admin     | planned  | N/A | N/A        | N/A    | Gather insights and analytics on cost of operation, per feature. |

---

## Fake features (example data)

---

## Pricing Philosophy & Margins

**Target margin:** 30-40% sustainably; max discount curve floors at 20%.

**Why these margins?**

- **High COO features** (e.g., advanced analytics at $6 COO): Lower margin (60%) because infra is expensive; discount curve helps offset
- **Low COO features** (e.g., profiles at $1 COO): High margin (70%+) because operational cost is low
- **Support & APIs**: 70-85% margin (human effort but high value)

**How discount curve uses this:**

- When user adds multiple features, discount asymptotes toward average COO
- User never pays less than COO (preserves minimum margin)
- Discount curve targets 40-50% discount at high feature adoption
- Free tier incentive (< €2-3): Always free for users who explore multiple premium features

---

## Updates & Notes

**Last updated:** Feb 2026

**Next steps:**

- Milestone 1 implementation and real COO monitoring
- Milestone 2 features finalized and priced based on market research
- Gather user feedback on Milestone 1 pricing and feature set
- Adjust future phase pricing as actual operational costs become known

## See Also

- [Modular Pricing & Weighted Discount Curve](./pricing-modular.md) — Discount curve math and formulas
- [Feature Access & Gating](./feature-access-gating.md) — Feature access control and JWT strategy
- [Milestone 1 Roadmap (Blogging + Smart Links)](./milestones.md) — Milestone scope and scheduling
- [Features](../../packages/db/model/features/features.md) — Feature registry and access model
- [Subscriptions](../../packages/db/model/subscriptions/subscriptions.md) — Billing and subscription lifecycle
