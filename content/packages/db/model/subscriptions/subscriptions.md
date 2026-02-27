title: Subscriptions
description: Billing lifecycle, Stripe integration, and subscription state for modular pricing

---

# Subscriptions

Subscriptions are the billing and entitlement-delivery layer. Feature definitions and access rules live in the Features domain; subscriptions track what a user is currently paying for and the resulting active feature set.

## Payment Processing

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

## Free and Paid Lifecycle

### Free user → Paid subscription

1. User selects feature bundle in UI.
2. Backend prices bundle (using feature definitions + discount curve).
3. If price is greater than 0, redirect to Stripe Checkout.
4. Stripe webhook creates/updates `user_subscriptions`.

### Paid subscription update

1. User adds/removes features.
2. Backend recalculates price.
3. Call `stripe.subscriptions.update(...)`.
4. Webhook syncs `user_subscriptions`.

### Cancellation

1. Call `stripe.subscriptions.del(stripe_subscription_id)`.
2. Webhook sets `is_active = false`.
3. Access updates on next entitlement/JWT refresh.

## Related Models

- [Features](../features/features.md) — Feature registry, access model, and ops-level gating
- [Permissions](../access/permissions.md) — Who can do what (separate from subscriptions)
- [Users & Organizations (WorkOS-Managed)](../identity/users.md) — User identity

## See Also

- [Feature Catalog & Pricing Transparency](../../../projects/vesta/feature-catalog.md) — Complete feature list with COO and pricing
- [Feature Access & Gating](../../../projects/vesta/feature-access-gating.md) — Feature gating strategies and JWT
- [Modular Pricing & Weighted Discount Curve](../../../projects/vesta/pricing-modular.md) — Discount curve math
