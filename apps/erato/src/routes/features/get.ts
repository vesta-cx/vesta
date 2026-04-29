/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope } from "../../auth/helpers";
import { ADMIN_SCOPE } from "../../auth/types";
import { getDB } from "../../db";
import { features } from "../../db/schema";
import { notFound } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/features/:slug" as const;

route.get(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "features:read");

	const [row] = await getDB(c.env.DB)
		.select()
		.from(features)
		.where(eq(features.slug, c.req.param("slug")))
		.limit(1);
	return row ? c.json(itemResponse(row)) : notFound(c, "Feature");
});

export default {
	route,
	method: "GET" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Get feature by slug",
	auth_required: true,
	scopes: ["features:read"],
	scopes_any: [ADMIN_SCOPE, "features:read"],
};
