/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope } from "../../../auth/helpers";
import { ADMIN_SCOPE } from "../../../auth/types";
import { getDB } from "../../../db";
import { featurePricing, features } from "../../../db/schema";
import { notFound } from "../../../lib/errors";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();
const PATH = "/features/:slug/pricing" as const;

route.get(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "features:read");

	const slug = c.req.param("slug");
	const db = getDB(c.env.DB);
	const [existing] = await db
		.select({
			slug: features.slug,
			basePriceCents: features.basePriceCents,
			costOfOperation: features.costOfOperation,
			createdAt: features.createdAt,
			updatedAt: features.updatedAt,
		})
		.from(features)
		.where(eq(features.slug, slug))
		.limit(1);
	if (!existing) return notFound(c, "Feature");

	const [row] = await db
		.select()
		.from(featurePricing)
		.where(eq(featurePricing.featureSlug, slug))
		.limit(1);

	if (row) return c.json(itemResponse(row));

	// No override set; echo the feature defaults as effective pricing.
	return c.json(
		itemResponse({
			featureSlug: slug,
			basePriceCents: existing.basePriceCents,
			costOfOperation: existing.costOfOperation,
			createdAt: existing.createdAt,
			updatedAt: existing.updatedAt,
		}),
	);
});

export default {
	route,
	method: "GET" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Get feature pricing",
	auth_required: true,
	scopes: ["features:read"],
	scopes_any: [ADMIN_SCOPE, "features:read"],
};
