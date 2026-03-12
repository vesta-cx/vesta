/** @format */

import { relations } from "drizzle-orm";
import {
	integer,
	primaryKey,
	real,
	sqliteTable,
	text,
} from "drizzle-orm/sqlite-core";

export const FEATURE_CATEGORIES = [
	"identity",
	"content",
	"discovery",
	"analytics",
	"monetization",
	"admin",
	"support",
] as const;
export type FeatureCategory = (typeof FEATURE_CATEGORIES)[number];

export const DISCOUNT_TYPES = ["volume", "promo", "free-incentive"] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const features = sqliteTable("features", {
	slug: text("slug").primaryKey(),
	name: text("name").notNull(),
	description: text("description"),
	category: text("category", { enum: FEATURE_CATEGORIES }).notNull(),
	milestone: integer("milestone"),
	basePriceCents: integer("base_price_cents").notNull().default(0),
	costOfOperation: integer("cost_of_operation").notNull().default(0),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export const userFeatures = sqliteTable(
	"user_features",
	{
		userId: text("user_id").notNull(),
		featureSlug: text("feature_slug")
			.notNull()
			.references(() => features.slug),
		limitValue: integer("limit_value"),
		grantedAt: integer("granted_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer("updated_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => [primaryKey({ columns: [table.userId, table.featureSlug] })],
);

export const featurePricing = sqliteTable("feature_pricing", {
	featureSlug: text("feature_slug")
		.primaryKey()
		.references(() => features.slug),
	basePriceCents: integer("base_price_cents").notNull().default(0),
	costOfOperation: integer("cost_of_operation").notNull().default(0),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export const featurePresets = sqliteTable("feature_presets", {
	name: text("name").primaryKey(),
	features: text("features", { mode: "json" })
		.$type<string[]>()
		.notNull(),
	description: text("description"),
	displayOrder: integer("display_order").notNull().default(0),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export const userSubscriptions = sqliteTable("user_subscriptions", {
	userId: text("user_id").primaryKey(),
	stripeCustomerId: text("stripe_customer_id"),
	stripeSubscriptionId: text("stripe_subscription_id"),
	activeFeatures: text("active_features", { mode: "json" }).$type<
		string[]
	>(),
	customPriceCents: integer("custom_price_cents").notNull().default(0),
	discountPct: real("discount_pct").notNull().default(0),
	discountType: text("discount_type", { enum: DISCOUNT_TYPES }),
	billingCycleStart: integer("billing_cycle_start", {
		mode: "timestamp",
	}),
	billingCycleEnd: integer("billing_cycle_end", { mode: "timestamp" }),
	isActive: integer("is_active", { mode: "boolean" })
		.notNull()
		.default(false),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export const featuresRelations = relations(features, ({ many, one }) => ({
	userFeatures: many(userFeatures),
	pricing: one(featurePricing, {
		fields: [features.slug],
		references: [featurePricing.featureSlug],
	}),
}));

export const userFeaturesRelations = relations(userFeatures, ({ one }) => ({
	feature: one(features, {
		fields: [userFeatures.featureSlug],
		references: [features.slug],
	}),
}));

export const featurePricingRelations = relations(featurePricing, ({ one }) => ({
	feature: one(features, {
		fields: [featurePricing.featureSlug],
		references: [features.slug],
	}),
}));
