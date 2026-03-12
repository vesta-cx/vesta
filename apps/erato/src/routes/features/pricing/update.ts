/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, hasScope } from "../../../auth/helpers";
import { getDB } from "../../../db";
import { featurePricing, features } from "../../../db/schema";
import { forbidden, notFound } from "../../../lib/errors";
import { parseBody, isResponse } from "../../../lib/validation";
import { updateFeaturePricingSchema } from "../../../services/features";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();

route.put("/features/:slug/pricing", async (c) => {
	const auth = requireAuth(c.get("auth"));
	if (!hasScope(auth, "admin")) return forbidden(c);

	const slug = c.req.param("slug");
	const parsed = await parseBody(c, updateFeaturePricingSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDB(c.env.DB);

	const [existingFeature] = await db
		.select()
		.from(features)
		.where(eq(features.slug, slug))
		.limit(1);
	if (!existingFeature) return notFound(c, "Feature");

	const [existing] = await db
		.select()
		.from(featurePricing)
		.where(eq(featurePricing.featureSlug, slug))
		.limit(1);

	if (existing) {
		const [row] = await db
			.update(featurePricing)
			.set({ ...parsed, updatedAt: new Date() })
			.where(eq(featurePricing.featureSlug, slug))
			.returning();
		return row ?
				c.json(itemResponse(row))
			:	notFound(c, "Feature pricing");
	}

	const [row] = await db
		.insert(featurePricing)
		.values({
			featureSlug: slug,
			basePriceCents: parsed.basePriceCents,
			costOfOperation: parsed.costOfOperation,
		})
		.returning();
	return row ? c.json(itemResponse(row)) : notFound(c, "Feature pricing");
});

export default {
	route,
	method: "PUT" as RouteMetadata["method"],
	path: "/features/:slug/pricing",
	description: "Update feature pricing",
	auth_required: true,
	scopes: ["admin"],
};
