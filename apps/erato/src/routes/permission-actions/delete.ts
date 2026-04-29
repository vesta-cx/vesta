/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { ADMIN_SCOPE } from "../../auth/types";
import { requireAuth, requireScope } from "../../auth/helpers";
import { getDB } from "../../db";
import { permissionActions } from "../../db/schema";
import { notFound } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/permission-actions/:slug" as const;

route.delete(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, ADMIN_SCOPE);

	const slug = c.req.param("slug");
	const db = getDB(c.env.DB);
	const [row] = await db
		.delete(permissionActions)
		.where(eq(permissionActions.slug, slug))
		.returning();
	if (!row) return notFound(c, "Permission action");

	return c.body(null, 204);
});

export default {
	route,
	method: "DELETE" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Delete permission action (admin only)",
	auth_required: true,
	scopes: [ADMIN_SCOPE],
};
