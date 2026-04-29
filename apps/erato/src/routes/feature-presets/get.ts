/** @format */

import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { requireAuth, requireScope } from "../../auth/helpers";
import { ADMIN_SCOPE } from "../../auth/types";
import { getDB } from "../../db";
import { featurePresets } from "../../db/schema";
import { notFound } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/feature-presets/:name" as const;

route.get(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "features:read");

	const [row] = await getDB(c.env.DB)
		.select({
			name: featurePresets.name,
			features: featurePresets.features,
			description: featurePresets.description,
			displayOrder: featurePresets.displayOrder,
			createdAt: featurePresets.createdAt,
			updatedAt: featurePresets.updatedAt,
		})
		.from(featurePresets)
		.where(eq(featurePresets.name, c.req.param("name")))
		.limit(1);
	return row ? c.json(itemResponse(row)) : notFound(c, "Feature preset");
});

export default {
	route,
	method: "GET" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Get feature preset by name",
	auth_required: true,
	scopes: ["features:read"],
	scopes_any: [ADMIN_SCOPE, "features:read"],
};
