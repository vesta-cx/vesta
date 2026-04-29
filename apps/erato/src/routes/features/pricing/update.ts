/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope } from "../../../auth/helpers";
import { ADMIN_SCOPE } from "../../../auth/types";
import { getDB } from "../../../db";
import { featurePricing, features } from "../../../db/schema";
import { expectOne } from "../../../lib/db-helpers";
import { notFound } from "../../../lib/errors";
import { parseBody, isResponse } from "../../../lib/validation";
import { updateFeaturePricingSchema } from "../../../services/features";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();
const PATH = "/features/:slug/pricing" as const;

route.put(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, ADMIN_SCOPE);

	const slug = c.req.param("slug");
	const parsed = await parseBody(c, updateFeaturePricingSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDB(c.env.DB);
	const [existingFeature] = await db
		.select({ slug: features.slug })
		.from(features)
		.where(eq(features.slug, slug))
		.limit(1);
	if (!existingFeature) return notFound(c, "Feature");

	const rows = await db
		.insert(featurePricing)
		.values({ featureSlug: slug, ...parsed })
		.onConflictDoUpdate({
			target: featurePricing.featureSlug,
			set: { ...parsed, updatedAt: new Date() },
		})
		.returning();
	return c.json(itemResponse(expectOne(rows, "Feature pricing upsert")));
});

export default {
	route,
	method: "PUT" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Update feature pricing",
	auth_required: true,
	scopes: [ADMIN_SCOPE],
};
