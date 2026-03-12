/** @format */

import { DISCOUNT_TYPES } from "../db/schema";
import { z } from "../lib/validation";

export const createSubscriptionSchema = z.object({
	userId: z.string().min(1),
	stripeCustomerId: z.string().nullable().optional(),
	stripeSubscriptionId: z.string().nullable().optional(),
	activeFeatures: z.array(z.string()).nullable().optional(),
	customPriceCents: z.number().int().optional(),
	discountPct: z.number().optional(),
	discountType: z.enum(DISCOUNT_TYPES).nullable().optional(),
	isActive: z.boolean().optional(),
});

export const updateSubscriptionSchema = z.object({
	stripeCustomerId: z.string().nullable().optional(),
	stripeSubscriptionId: z.string().nullable().optional(),
	activeFeatures: z.array(z.string()).nullable().optional(),
	customPriceCents: z.number().int().optional(),
	discountPct: z.number().optional(),
	discountType: z.enum(DISCOUNT_TYPES).nullable().optional(),
	billingCycleStart: z.coerce.date().nullable().optional(),
	billingCycleEnd: z.coerce.date().nullable().optional(),
	isActive: z.boolean().optional(),
});

export const grantUserFeatureSchema = z.object({
	featureSlug: z.string().min(1),
	limitValue: z.number().int().nullable().optional(),
});
