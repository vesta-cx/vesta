---
title: Feature Access & Gating
description: Global feature access gates for rolling updates, beta testing, and feature-level pricing
---

# Feature Access & Gating

Every feature or functionality in vesta, even free features, has a global access gate. This enables:

1. **Rolling updates** — Deploy features to staging subset of users before full rollout
2. **Beta testing & canary releases** — Gradually test with real users before GA
3. **Feature-level pricing** — Users subscribe to individual features (with tier presets as shortcuts)
4. **A/B testing** — Run experiments on feature variations

## Core Concept: Feature Flags + Entitlements

**Feature flags** control visibility/availability (per-user, per-workspace, per-tier).

**Entitlements** define what a user is allowed to do with a feature (based on subscription).

### Feature Registry

All features are registered in a central `features` table:

```
features:
id                   UUID primary key
slug                 string unique (e.g., "custom-domains", "advanced-analytics")
name                 string (display name)
description          text (what it does)
category             string ('profiles' | 'analytics' | 'content' | 'admin' | ...)
cost_tier            'free' | 'basic' | 'pro' | 'enterprise'
base_price_cents     integer (full price, before discounts)
cost_of_operation    integer (actual operational cost in cents; used for discount floor)
is_alpha             boolean (feature in alpha/beta?)
alpha_user_ids       array<string> (WorkOS IDs whitelisted for alpha)
launch_date          timestamp
created_at           timestamp
updated_at           timestamp
```

**Key fields:**

- `cost_tier` — Pre-assigned tier for tier presets (see [Pricing Tiers & Presets](#pricing-tiers--presets))
- `cost_of_operation` — Actual hosting/infra cost; used to calculate discount curve floor
- `base_price_cents` — Full price (retail); discount curve asymptotes toward cost_of_operation
- `is_alpha` / `alpha_user_ids` — Gradual rollout control

### Subscription Model: User Entitlements

Users don't subscribe to tiers; they subscribe to individual features with tier presets as shortcuts:

```
user_subscriptions:
user_id              string (WorkOS user ID) primary key
workspace_id         UUID (if workspace-specific; nullable for user-scoped)
active_features      array<UUID> (feature IDs user has access to)
tier_preset          'free' | 'basic' | 'pro' | 'enterprise' | null (null = custom)
custom_price_cents   integer (total monthly cost after discounts)
discount_pct         decimal (0-100, percentage discount applied; used for analytics)
billing_period_start timestamp
billing_period_end   timestamp
created_at           timestamp
updated_at           timestamp
```

When a user selects a tier preset, `active_features` is populated with all features in that tier. Users can then add/remove individual features to customize.

## Feature Access Query

To check if a user can access a feature:

```typescript
async function canUserAccessFeature(userId, featureSlug) {
  // 1. Get user's active subscription
  const subscription = await db.userSubscriptions.findUnique({
    where: { user_id: userId },
  })

  if (!subscription) return false // No subscription = no access

  // 2. Look up feature
  const feature = await db.features.findUnique({
    where: { slug: featureSlug },
  })

  if (!feature) return false // Feature doesn't exist

  // 3. Check if user has feature in active_features
  return subscription.active_features.includes(feature.id)
}
```

## Alpha/Beta Gating

For gradual rollout:

```typescript
async function shouldUserSeeFeature(userId, featureSlug) {
  const feature = await db.features.findUnique({ where: { slug: featureSlug } })

  // If feature is in alpha, only show to whitelisted users
  if (feature.is_alpha) {
    return feature.alpha_user_ids.includes(userId)
  }

  // Otherwise, check entitlement
  return canUserAccessFeature(userId, featureSlug)
}
```

### Rollout Strategy

1. **Alpha phase** — Add feature with `is_alpha: true` and small `alpha_user_ids` list
2. **Expand alpha** — Gradually add more users to `alpha_user_ids`
3. **Public beta** — Set `is_alpha: false`, all users can enable in UI (but need subscription)
4. **GA** — Feature fully live

This allows testing in production with real users before public release.

## JWT Strategy: Fast Frontend Gating

For performance, store feature access in the user's JWT so frontend checks are instant (no server round-trip).

### JWT Payload

Include `active_features` as an array of feature slugs:

```typescript
// JWT payload
{
  sub: "usr_123...",                    // WorkOS user ID
  org_id: "org_456...",                 // WorkOS org ID
  workspace_id: "ws_789...",            // Current workspace
  active_features: [
    "custom-domains",
    "advanced-analytics",
    "ad-integrations"
  ],
  iat: 1677600000,
  exp: 1677603600,
  ...other_claims
}
```

### Frontend Usage

```typescript
// Frontend: Instant check (no server call)
const hasFeature = (token) => token.active_features.includes("custom-domains")

if (hasFeature(userToken)) {
  showCustomDomainUI()
} else {
  showUpgradePrompt()
}
```

### Backend Validation

**For non-critical reads:** Trust JWT (faster, reduces database load).

**For critical operations** (subscription changes, paid features, data mutations): Query database to re-verify:

```typescript
// Backend: POST /api/domains (critical payment operation)
const verified = await canUserAccessFeature(userId, "custom-domains")
if (!verified) {
  return res.status(403).json({ error: "Feature not in your subscription" })
}
// Proceed with domain creation
```

### Token Refresh Strategy

Feature changes have latency until token refresh:

- **Default:** Refresh token every 15-30 min for active users
- **On subscription change:** Force refresh immediately
- **On feature add/remove:** Invalidate + force re-auth

This balances performance (fewer server calls) with responsiveness (changes visible within 30 min max).

### Alternative: Feature Bitmask

If you have 50+ features, use a bitmask instead of array to reduce JWT size:

```typescript
// Bitmask example: 32-bit integer can represent 32 features
const FEATURES = {
  "custom-domains": 0,
  "advanced-analytics": 1,
  "ad-integrations": 2,
  // ... etc
}

const featureMask = 0b0000000000000000000000000000011 // Features 0 and 1 enabled

// Check if feature enabled
const hasFeature = (mask, featureIndex) => (mask & (1 << featureIndex)) !== 0
hasFeature(featureMask, 0) // true
hasFeature(featureMask, 2) // false
```

This is more compact but less readable; use if JWT size becomes a bottleneck.

## See Also

- [Feature Catalog & Pricing Transparency](./feature-catalog.md) — Complete feature list and pricing
- [Modular Pricing & Weighted Discount Curve](./pricing-modular.md) — Individual feature pricing and tier presets
- [Development Checklist (Phase 1)](./development-checklist.md) — Feature gating checklist for PRs
