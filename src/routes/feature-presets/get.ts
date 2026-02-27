/** @format */

import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { hasScope, isAuthenticated, requireAuth } from "../../auth/helpers";
import { getDB } from "../../db";
import { featurePresets } from "../../db/schema";
import type { AppEnv } from "../../env";
import { forbidden, notFound } from "../../lib/errors";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.get("/feature-presets/:name", async (c) => {
	const auth = requireAuth(c.get("auth"));
	if (!hasScope(auth, "features:read")) {
		return forbidden(c);
	}

	const name = c.req.param("name");
	const db = getDB(c.env.DB);

	const [row] = await db
		.select()
		.from(featurePresets)
		.where(eq(featurePresets.name, name))
		.limit(1);
	return row ? c.json(itemResponse(row)) : notFound(c, "Feature preset");
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/feature-presets/:name",
	description: "Get feature preset by name",
	auth_required: true,
	scopes: ["features:read"],
};
