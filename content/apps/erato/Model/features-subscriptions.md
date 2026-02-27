---
title: Features & Subscriptions
description: Feature registry, user entitlements, and subscription management for modular pricing
---

# Features & Subscriptions

Features are the core unit of vesta's modular pricing and access control system. Features define *what capabilities exist*. Users subscribe to individual features and gain per-feature limits. Subscriptions are managed via Stripe and queried for entitlements.

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

**Design principle:**
- Slug is primary key (self-documenting, no UUID needed)
- Features table is pure metadata (like `permission_actions`)
- Pricing data lives in the table for discount curve calculations
- `milestone` represents sprint-based delivery
- Alpha/beta rollout tracking is handled outside data model (feature flags, DevOps config)

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

**Design principle:**
- Replaces separate `feature_limits` table
- Per-user limits (more flexible than tier-based limits)
- Direct link between user and feature with their specific limit

**Examples:**
```
user_123 | custom-domains      | 1 (user can create 1 custom domain)
user_123 | media-uploads        | 5 (user can upload 5GB/month)
user_123 | advanced-analytics   | null (unlimited)
user_456 | custom-domains       | 5 (upgraded user has 5 custom domains)
```

### Feature Pricing Table

Base pricing for discount curve calculations (no tiers, just reference prices):

```
feature_pricing:
feature_slug         string primary key FK → features.slug
base_price_cents     integer (full retail price in cents)
cost_of_operation    integer (minimum floor price in cents)
created_at           timestamp
updated_at           timestamp
```

**Design principle:**
- No tier column (tiers are UI presets, not in data model)
- Pricing is the same for all users; discounts applied at subscription level
- Used by discount curve algorithm to calculate weighted discounts

**Query pattern:**
```sql
SELECT base_price_cents, cost_of_operation FROM feature_pricing
WHERE feature_slug = 'custom-domains';
-- Returns: { base_price_cents: 1000, cost_of_operation: 300 }
```

### Feature Presets (UI-Only Bundles)

Predefined feature collections for common use cases (no database requirement, just UI reference):

```
feature_presets:
name                 string primary key unique ('free' | 'basic' | 'pro' | 'enterprise')
features             array<string> (feature slugs in preset; e.g., ["analytics", "smart-links-basic"])
description          text (marketing copy: "Great for getting started")
display_order        integer (sort order in UI)
created_at           timestamp
updated_at           timestamp
```

**Design principle:**
- Presets are UI-only shortcuts; not a constraint on what users can select
- User can select *any* combination of features, ignoring presets
- Presets make common choices convenient, but no backend enforcement
- When user clicks "Pro preset", UI populates form with those features; user submits to create subscription

**Lookup pattern:** UI fetches presets by name to populate form defaults. No data model constraint.

### Free Feature Budget

All free users get a **feature budget** (default €2–3? TBD). They can pick any combination of features that fits within their budget. If total price ≤ threshold, they subscribe free; if over, they pay the difference.

**UI flow:**
1. User selects features (no disabled states — all features available)
2. UI shows remaining budget in real-time as they add/remove
3. Submit button reflects their choice:
   - Within budget: "Subscribe Free"
   - Over budget: "Subscribe & Pay €X"

**Implementation:**
- Calculate feature combo total with discount curve
- If total ≤ FREE_THRESHOLD (e.g., 300 cents = €3), set `custom_price_cents = 0`
- Set `discount_type = 'free-incentive'` on `user_subscriptions`
- On Stripe side, apply coupon for the exact discount needed (so total becomes €0 or the overage amount)
- Great UX: transparent budget, clear pricing, users feel in control

## Subscriptions & Payment Processing

### Stripe Integration (Payment Processing)

vesta uses **Stripe** for:
- Recurring billing
- Payment method storage
- Subscription lifecycle management
- Refunds & disputes

**Stripe side:**
- Create `Stripe.Subscription` when user subscribes
- Store `stripe_subscription_id` in vesta DB
- Update subscription via Stripe API (add/remove items)
- Webhook: listen for `customer.subscription.updated` and `customer.subscription.deleted`

### User Subscriptions Table

vesta's subscription metadata (not payment tracking):

```
user_subscriptions:
user_id              string (WorkOS user ID) primary key
stripe_customer_id   string (Stripe customer ID for this user)
stripe_subscription_id string | null (current active Stripe subscription ID; null if free)
active_features      array<string> (feature slugs user has access to)
custom_price_cents   integer (calculated monthly cost after discounts; 0 if free)
discount_pct         decimal (0-100 percentage discount; used for analytics)
discount_type        string ('volume' | 'promo' | 'free-incentive' | null; for tracking)
billing_cycle_start  timestamp (when current billing cycle began)
billing_cycle_end    timestamp (when current billing cycle ends)
is_active            boolean (subscription is active; false = paused/cancelled)
created_at           timestamp
updated_at           timestamp
```

**Design principle:**
- vesta stores subscription metadata only (what features, what price)
- Stripe is the source of truth for payment status
- Query Stripe for subscription status, sync to vesta on webhook events
- `stripe_subscription_id = null` means user is on free tier (no payment method needed)

### Subscription Lifecycle

**Free user → Premium:**
1. User selects features in UI
2. UI calculates price (calls backend discount curve)
3. If price > €0, redirect to Stripe Checkout
4. Stripe returns `session_id`
5. On success, webhook creates `user_subscriptions` record with `stripe_subscription_id`

**Premium user updates subscription:**
1. User adds/removes features
2. Backend recalculates price
3. Call `stripe.subscriptions.update(stripe_subscription_id, { items: [...] })`
4. Stripe webhook syncs to `user_subscriptions`

**Premium user cancels:**
1. Call `stripe.subscriptions.del(stripe_subscription_id)`
2. Webhook sets `is_active = false` in `user_subscriptions`
3. Feature access revoked on next JWT refresh

### Discount Tracking

Discounts are tracked directly on the `user_subscriptions` row via `discount_pct` and `discount_type` fields (`'volume'`, `'promo'`, or `'free-incentive'`). The freemium threshold is a static application-level constant — no separate table needed. Stripe webhook events and the subscription lifecycle provide the audit trail.

## Feature Access Queries

### Check if user has feature

```typescript
async function canUserAccessFeature(userId, featureSlug) {
  const userFeature = await db.userFeatures.findUnique({
    where: { user_id_feature_slug: { user_id: userId, feature_slug: featureSlug } }
  })

  return userFeature !== null // User has feature if row exists
}
```

### Get user's feature limit

```typescript
async function getUserFeatureLimit(userId, featureSlug) {
  const userFeature = await db.userFeatures.findUnique({
    where: { user_id_feature_slug: { user_id: userId, feature_slug: featureSlug } }
  })

  return userFeature?.limit_value ?? null // null = unlimited or not subscribed
}
```

### Generate JWT with features

When user logs in, include features in JWT:

```typescript
const userFeatures = await db.userFeatures.findMany({
  where: { user_id: workosUserId },
  select: { feature_slug: true }
})

const token = jwt.sign(
  {
    sub: workosUserId,
    org_id: user.organization_id,
    active_features: userFeatures.map(f => f.feature_slug),
    iat: now,
    exp: now + 1800
  },
  SECRET
)
```

## Discount Curve

See [Modular Pricing & Weighted Discount Curve](../../../projects/vesta/pricing-modular.md) for math. Implementation:

1. Get user's selected `active_features` array
2. Look up each feature's `base_price_cents` and `cost_of_operation` from `features` table
3. Calculate weighted discount based on total value
4. Apply discount to each feature (floored at `cost_of_operation`)
5. Check if final price is under FREE_THRESHOLD (€2-3); if so, set to €0 with `discount_type='free-incentive'`
6. Store final `custom_price_cents` and `discount_pct` in `user_subscriptions`

## Example Feature Definitions

### Admin: Claim Feature

Allows a user to self-assign any feature for testing/admin purposes. Useful for QA and development.

```
INSERT INTO features (slug, name, description, category, milestone, base_price_cents, cost_of_operation, created_at, updated_at)
VALUES (
  'claim-feature',
  'Claim Feature',
  'Self-assign any feature for testing and admin purposes. Used by internal team and QA.',
  'admin',
  null,
  0,
  0,
  NOW(),
  NOW()
);

-- Grant this feature to admin users
INSERT INTO user_features (user_id, feature_slug, limit_value, granted_at, created_at, updated_at)
VALUES (
  'usr_admin_user_123',
  'claim-feature',
  null,
  NOW(),
  NOW(),
  NOW()
);
```

**Capabilities:**
- User with this feature can grant themselves any other feature
- Useful for testing feature behavior, pricing, limits
- Not sold; internal only
- No operational cost

**Usage:**
```typescript
// Admin user has 'claim-feature' → can call:
async function claimFeature(adminUserId, targetUserId, featureSlug, limitValue = null) {
  // Verify admin has claim-feature
  const hasClaim = await canUserAccessFeature(adminUserId, 'claim-feature');
  if (!hasClaim) throw new Error('Unauthorized');
  
  // Grant feature to target user
  await db.userFeatures.create({
    data: {
      user_id: targetUserId,
      feature_slug: featureSlug,
      limit_value: limitValue,
      granted_at: new Date()
    }
  });
  
  // Refresh target user's JWT
  await refreshUserJWT(targetUserId);
}
```

## Related Models

- [Permissions](./permissions.md) — Who can do what (separate from feature access)
- [Users & Organizations (WorkOS-Managed)](./users.md) — User identity
- [Engagements](./engagements.md) — User interactions
- [Resource](./resource.md) — Creative works (what features enable)

## See Also

- [Feature Catalog & Pricing Transparency](../../../projects/vesta/feature-catalog.md) — Complete feature list with COO and pricing
- [Feature Access & Gating](../../../projects/vesta/feature-access-gating.md) — Feature gating strategies and JWT
- [Modular Pricing & Weighted Discount Curve](../../../projects/vesta/pricing-modular.md) — Discount curve math
