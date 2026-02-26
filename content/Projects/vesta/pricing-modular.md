---
title: Modular Pricing & Weighted Discount Curve
description: Feature-level pricing with tier presets and weighted discount curve based on feature value
---

# Modular Pricing & Weighted Discount Curve

vesta uses **feature-level pricing** with tier presets as shortcuts. A user can subscribe to individual features, and their total price is calculated with a weighted discount curve that prevents users from "gaming" the system by adding cheap features.

## Core Philosophy

**Problem:** Artists only pay for features they actually need. Existing competitors force you to pay for bundled features you don't use.

**Solution:** Modular pricing where each feature has a transparent base price and cost of operation. As users add features, they get a volume discount that approaches a mathematical limit (preventing unlimited discounting).

**Wrinkle:** If discounts are based purely on feature count, a user could add 10 cheap features ($2/month each) to get a deep discount, then add 1 expensive feature ($50/month) and pay less total than the expensive feature alone. **Weighted discounts** prevent this by making expensive features "count more" toward the discount curve.

## Feature Pricing Model

Every feature has two prices:

### Base Price
`base_price_cents` — The full, retail price of the feature. This is what a user pays if they buy only this feature (no discount).

**Example:**
- Custom domains: 500¢ ($5/month)
- Advanced analytics: 2000¢ ($20/month)
- Ad integrations: 1500¢ ($15/month)

### Cost of Operation
`cost_of_operation` — The actual infrastructure + support cost to run the feature.

**Example:**
- Custom domains: 100¢ (SSL cert, DNS routing, small support overhead)
- Advanced analytics: 800¢ (compute for aggregations, storage)
- Ad integrations: 200¢ (third-party API calls, minimal overhead)

**Formula:** Discount curve asymptotes toward cost_of_operation, ensuring margin is preserved even at max discount.

## Weighted Discount Curve

When a user adds multiple features, a **weighted discount** is applied. The discount is based on the total "value weight" of features, not just count.

### Value Weight

Each feature's contribution to the discount curve is proportional to its value (base price):

```
value_weight = base_price_cents / sum(all_features_base_price_cents)
total_weight = sum(all_value_weights) = 1.0
```

**Example:** User subscribes to 3 features:
- Custom domains: base 500¢
- Advanced analytics: base 2000¢
- Ad integrations: base 1500¢

```
Total base: 4000¢

weights:
- Custom domains: 500 / 4000 = 0.125 (12.5%)
- Advanced analytics: 2000 / 4000 = 0.5 (50%)
- Ad integrations: 1500 / 4000 = 0.375 (37.5%)
```

### Discount Calculation

The discount curve is a sigmoid/S-curve that approaches a **maximum discount cap** as the user adds more valuable features:

```
discount_pct = max_discount × (total_weight / (total_weight + inflection_point))

where:
- max_discount = 50% (discount never exceeds 50%, preventing too-cheap pricing)
- inflection_point = 0.3 (tuning parameter; adjust to control curve shape)
```

The formula ensures:
- **Early features:** Smaller discounts (incentivizes staying on cheaper tier)
- **Mid-range features:** Growing discounts (encourages adding features)
- **Many features:** Discounts plateau (prevents unlimited discounting)

### Applying the Discount

Once discount is calculated, apply it to each feature:

```
feature_price_after_discount = base_price - (base_price × discount_pct)

BUT: floor at cost_of_operation

final_price = max(feature_price_after_discount, cost_of_operation)
```

This ensures vesta never loses money on a feature, even with deep discounts.

**Total monthly charge:**
```
monthly_total = sum(final_price for each feature)
```

## Worked Example

**User adds 3 features:**

| Feature | Base Price | Cost of Op | Weight | Discount 50%? | After Discount | Floor at Cost | Final |
|---------|-----------|-----------|--------|---------------|----------------|--------------|-------|
| Custom domains | 500¢ | 100¢ | 12.5% | 250¢ | 100¢ | 100¢ |
| Advanced analytics | 2000¢ | 800¢ | 50% | 1000¢ | 1000¢ | 800¢ |
| Ad integrations | 1500¢ | 200¢ | 37.5% | 750¢ | 750¢ | 200¢ |
| **Total** | **4000¢** | **1100¢** | **100%** | **50% discount** | **1850¢** | **1100¢** |

**User pays:** $18.50/month (vs. $40/month at full price)

Now user adds a 4th cheap feature:

| Feature | Base Price | Cost of Op | Weight | Discount % | After Discount | Floor at Cost | Final |
|---------|-----------|-----------|--------|------------|----------------|--------------|-------|
| Custom domains | 500¢ | 100¢ | 7.7% | 55% | 225¢ | 100¢ |
| Advanced analytics | 2000¢ | 800¢ | 30.8% | 55% | 900¢ | 800¢ |
| Ad integrations | 1500¢ | 200¢ | 23.1% | 55% | 675¢ | 200¢ |
| **New feature** | **750¢** | **50¢** | **11.5%** | **55% discount** | **337.5¢** | **50¢** |
| **Total** | **6250¢** | **1150¢** | **100%** | **55% discount** | **2807.5¢** | **1150¢** |

**User pays:** $11.50/month (vs. $62.50 at full price)

Notice the new cheap feature contributes only 11.5% weight, so discount increases modestly (50% → 55%). The floor at cost_of_operation ensures vesta's margin.

## Tier Presets

Tier presets bundle common features and assign a default tier so users don't have to customize:

```
tier_presets:
id           UUID primary key
name         string ('free' | 'basic' | 'pro' | 'enterprise')
features     array<UUID> (feature IDs in this preset)
description  text
display_order integer
created_at   timestamp
```

**Example Free tier:**
- Creator profiles
- Blogging engine
- Smart links (basic)
- User engagement (like, comment, repost, follow)
- Collections (read-only)

**Example Basic tier:**
- Everything in Free +
- Custom domains
- Basic analytics
- Advanced collections (write)

**Example Pro tier:**
- Everything in Basic +
- Advanced analytics
- Ad integrations
- Team accounts (beta)

When a user selects a preset, `user_subscriptions.active_features` is populated with all features in that tier. They can then customize by adding/removing individual features.

## Pricing Philosophy

1. **Transparent** — Every feature lists its base price, cost of operation, and discount tier
2. **Fair** — Discounts reward loyalty (more features = better value) but don't undercut margins
3. **Flexible** — Users build custom plans or use presets as starting points
4. **Sustainable** — Minimum revenue per feature (cost_of_operation) ensures business viability

## Discount Tuning

The curve is controlled by two parameters:

- **`max_discount`** (currently 50%) — Adjust to control maximum discount. Lower = more revenue, higher = more attractive for power users
- **`inflection_point`** (currently 0.3) — Controls curve shape. Lower = steeper early, flatter later. Higher = gradual throughout

**Tuning strategy:**
1. Monitor usage patterns (how many features do users typically add?)
2. Monitor LTV (lifetime value) at different discount levels
3. Adjust in 5% increments based on cohort behavior

## See Also

- [[./feature-catalog.md]] — Complete feature list with COO, base prices, and tier assignments
- [[./feature-access-gating.md]] — Feature registry and access control
- [[./phase-1-roadmap.md]] — Phase 1 features and feature tiers
- [[../../../apps/erato/index.md]] — Data model (may need to extend for subscriptions)
