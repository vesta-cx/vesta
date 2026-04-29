/** @format */

import { DISCOUNT_TYPES } from "../db/schema";
import { z } from "../lib/validation";

const subscriptionSharedSchema = z.object({
	stripeCustomerId: z.string().nullable().optional(),
	stripeSubscriptionId: z.string().nullable().optional(),
	activeFeatures: z.array(z.string().min(1)).nullable().optional(),
	customPriceCents: z.number().int().nonnegative().optional(),
	discountPct: z.number().min(0).max(100).optional(),
	discountType: z.enum(DISCOUNT_TYPES).nullable().optional(),
	isActive: z.boolean().optional(),
});

export const createSubscriptionSchema = subscriptionSharedSchema.extend({
	userId: z.string().min(1),
});

export const updateSubscriptionSchema = subscriptionSharedSchema.extend({
	billingCycleStart: z.coerce.date().nullable().optional(),
	billingCycleEnd: z.coerce.date().nullable().optional(),
});
