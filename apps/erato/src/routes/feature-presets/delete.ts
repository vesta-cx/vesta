/** @format */

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

route.delete(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, ADMIN_SCOPE);

	const [row] = await getDB(c.env.DB)
		.delete(featurePresets)
		.where(eq(featurePresets.name, c.req.param("name")))
		.returning();
	if (!row) return notFound(c, "Feature preset");

	return c.body(null, 204);
});

export default {
	route,
	method: "DELETE" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Delete feature preset",
	auth_required: true,
	scopes: [ADMIN_SCOPE],
};
