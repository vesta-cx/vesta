/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { requireAuth, requireScope } from "../../auth/helpers";
import { ADMIN_SCOPE } from "../../auth/types";
import { getDB } from "../../db";
import { features } from "../../db/schema";
import { notFound } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/features/:slug" as const;

route.delete(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, ADMIN_SCOPE);

	const [row] = await getDB(c.env.DB)
		.delete(features)
		.where(eq(features.slug, c.req.param("slug")))
		.returning();
	if (!row) return notFound(c, "Feature");

	return c.body(null, 204);
});

export default {
	route,
	method: "DELETE" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Delete feature",
	auth_required: true,
	scopes: [ADMIN_SCOPE],
};
