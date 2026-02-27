---
title: Features
description: Feature registry, access entitlements, and ops-level feature access model
---

# Features

Features are the ops/access unit of vesta. They define what capabilities exist, who can access them, and which limits apply per user.

## Schema

### Features Table

Central registry of all vesta features (metadata only):

```
features:
slug                 string primary key (e.g., "custom-domains", "advanced-analytics")
name                 string (display name: "Custom Domains")
description          text (what it does)
category             string ('identity' | 'content' | 'discovery' | 'analytics' | 'monetization' | 'admin' | 'support')
milestone            integer (1, 2, 3 — when feature ships; or null if evergreen)
base_price_cents     integer (full retail price in cents; used for discount curve)
cost_of_operation    integer (monthly operational cost in cents; minimum floor price)
created_at           timestamp
updated_at           timestamp
```

### User Features Table

Which features a user has access to, and their per-feature limits:

```
user_features:
user_id              string (WorkOS user ID)
feature_slug         string FK → features.slug
limit_value          integer (per-user limit for this feature; null = unlimited)
granted_at           timestamp (when user gained access)
created_at           timestamp
updated_at           timestamp
primary key          (user_id, feature_slug)
```

### Feature Pricing Table

Reference prices used by pricing/discount logic:

```
feature_pricing:
feature_slug         string primary key FK → features.slug
base_price_cents     integer
cost_of_operation    integer
created_at           timestamp
updated_at           timestamp
```

### Feature Presets (UI-only)

```
feature_presets:
name                 string primary key unique ('free' | 'basic' | 'pro' | 'enterprise')
features             array<string> (feature slugs in preset)
description          text
display_order        integer
created_at           timestamp
updated_at           timestamp
```

## Feature Access Queries

### Check if user has feature

```typescript
async function canUserAccessFeature(userId, featureSlug) {
  const userFeature = await db.userFeatures.findUnique({
    where: { user_id_feature_slug: { user_id: userId, feature_slug: featureSlug } },
  })

  return userFeature !== null
}
```

### Get user's feature limit

```typescript
async function getUserFeatureLimit(userId, featureSlug) {
  const userFeature = await db.userFeatures.findUnique({
    where: { user_id_feature_slug: { user_id: userId, feature_slug: featureSlug } },
  })

  return userFeature?.limit_value ?? null
}
```

### Include feature access in JWT

```typescript
const userFeatures = await db.userFeatures.findMany({
  where: { user_id: workosUserId },
  select: { feature_slug: true },
})

const token = jwt.sign(
  {
    sub: workosUserId,
    org_id: user.organization_id,
    active_features: userFeatures.map((f) => f.feature_slug),
    iat: now,
    exp: now + 1800,
  },
  SECRET,
)
```

## Example: Admin Claim Feature

```sql
INSERT INTO features (slug, name, description, category, milestone, base_price_cents, cost_of_operation, created_at, updated_at)
VALUES ('claim-feature', 'Claim Feature', 'Self-assign any feature for testing and admin purposes.', 'admin', null, 0, 0, NOW(), NOW());
```

## Related Models

- [Subscriptions](../subscriptions/subscriptions.md) — Billing lifecycle and payment-backed feature activation
- [Permissions](../access/permissions.md) — Action-level authorization model
- [Users & Organizations (WorkOS-Managed)](../identity/users.md) — Subject identity context
