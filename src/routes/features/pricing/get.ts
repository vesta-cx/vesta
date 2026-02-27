import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { hasScope, isAuthenticated } from "../../../auth/helpers";
import { getDb } from "../../../db";
import { featurePricing, features } from "../../../db/schema";
import { forbidden, notFound } from "../../../lib/errors";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();

route.get("/features/:slug/pricing", async (c) => {
	const auth = c.get("auth");
	if (isAuthenticated(auth) && !hasScope(auth, "features:read")) {
		return forbidden(c);
	}

	const slug = c.req.param("slug");
	const db = getDb(c.env.DB);

	const [existing] = await db
		.select()
		.from(features)
		.where(eq(features.slug, slug))
		.limit(1);
	if (!existing) return notFound(c, "Feature");

	const [row] = await db
		.select()
		.from(featurePricing)
		.where(eq(featurePricing.featureSlug, slug))
		.limit(1);

	if (row) {
		return c.json(itemResponse(row));
	}
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
	method: "GET" as RouteMetadata["method"],
	path: "/features/:slug/pricing",
	description: "Get feature pricing",
	auth_required: false,
	scopes: ["features:read"],
};
