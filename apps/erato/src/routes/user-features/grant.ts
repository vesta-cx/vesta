/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, hasScope } from "../../auth/helpers";
import { getDB } from "../../db";
import { features, userFeatures } from "../../db/schema";
import { conflict, forbidden, notFound } from "../../lib/errors";
import { parseBody, isResponse } from "../../lib/validation";
import { grantUserFeatureSchema } from "../../services/subscriptions";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.post("/users/:userId/features", async (c) => {
	const auth = requireAuth(c.get("auth"));
	if (!hasScope(auth, "admin")) return forbidden(c);

	const userId = c.req.param("userId");
	const parsed = await parseBody(c, grantUserFeatureSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDB(c.env.DB);

	const [existingFeature] = await db
		.select()
		.from(features)
		.where(eq(features.slug, parsed.featureSlug))
		.limit(1);
	if (!existingFeature) return notFound(c, "Feature");

	try {
		const [row] = await db
			.insert(userFeatures)
			.values({
				userId,
				featureSlug: parsed.featureSlug,
				limitValue: parsed.limitValue ?? null,
			})
			.returning();
		return c.json(itemResponse(row!), 201);
	} catch (err) {
		if (err instanceof Error && /UNIQUE/i.test(err.message)) {
			return conflict(c, "User already has this feature");
		}
		throw err;
	}
});

export default {
	route,
	method: "POST" as RouteMetadata["method"],
	path: "/users/:userId/features",
	description: "Grant feature to user",
	auth_required: true,
	scopes: ["admin"],
};
