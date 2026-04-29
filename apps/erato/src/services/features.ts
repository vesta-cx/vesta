/** @format */

import type { ListQueryConfig } from "@mia-cx/drizzle-query-factory";
import {
	features,
	FEATURE_CATEGORIES,
	featurePresets,
	userFeatures,
} from "../db/schema";
import { z } from "../lib/validation";

const featurePricingShape = {
	basePriceCents: z.number().int().nonnegative(),
	costOfOperation: z.number().int().nonnegative(),
} as const;

export const featureListConfig: ListQueryConfig = {
	filters: {
		category: { column: features.category },
		name: { column: features.name, op: "like" },
	},
	sortable: {
		created_at: features.createdAt,
		updated_at: features.updatedAt,
		name: features.name,
	},
	defaultSort: { key: "created_at", dir: "desc" },
};

export const featurePresetListConfig: ListQueryConfig = {
	filters: {
		name: { column: featurePresets.name, op: "like" },
	},
	sortable: {
		display_order: featurePresets.displayOrder,
		created_at: featurePresets.createdAt,
		name: featurePresets.name,
	},
	defaultSort: { key: "display_order", dir: "asc" },
};

export const userFeatureListConfig: ListQueryConfig = {
	filters: {
		feature_slug: { column: userFeatures.featureSlug },
	},
	sortable: {
		feature_slug: userFeatures.featureSlug,
	},
	defaultSort: { key: "feature_slug", dir: "asc" },
};

export const createFeatureSchema = z.object({
	slug: z.string().min(1),
	name: z.string().min(1),
	description: z.string().nullable().optional(),
	category: z.enum(FEATURE_CATEGORIES),
	milestone: z.number().int().nullable().optional(),
	basePriceCents: featurePricingShape.basePriceCents.optional(),
	costOfOperation: featurePricingShape.costOfOperation.optional(),
});

export const updateFeatureSchema = z.object({
	name: z.string().min(1).optional(),
	description: z.string().nullable().optional(),
	category: z.enum(FEATURE_CATEGORIES).optional(),
	milestone: z.number().int().nullable().optional(),
	basePriceCents: featurePricingShape.basePriceCents.optional(),
	costOfOperation: featurePricingShape.costOfOperation.optional(),
});

export const updateFeaturePricingSchema = z.object(featurePricingShape);

export const createFeaturePresetSchema = z.object({
	name: z.string().min(1),
	features: z.array(z.string().min(1)),
	description: z.string().nullable().optional(),
	displayOrder: z.number().int().optional(),
});

export const updateFeaturePresetSchema = z.object({
	name: z.string().min(1).optional(),
	features: z.array(z.string().min(1)).optional(),
	description: z.string().nullable().optional(),
	displayOrder: z.number().int().optional(),
});

export const grantUserFeatureSchema = z.object({
	featureSlug: z.string().min(1),
	limitValue: z.number().int().nullable().optional(),
});
