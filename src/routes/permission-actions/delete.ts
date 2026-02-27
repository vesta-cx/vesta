/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { requireScope } from "../../auth/helpers";
import { getDB } from "../../db";
import { permissionActions } from "../../db/schema";
import { notFound } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.delete("/permission-actions/:slug", async (c) => {
	const auth = c.get("auth");
	requireScope(auth, "admin");

	const slug = c.req.param("slug");
	const db = getDB(c.env.DB);

	const [existing] = await db
		.select()
		.from(permissionActions)
		.where(eq(permissionActions.slug, slug))
		.limit(1);
	if (!existing) return notFound(c, "Permission action");

	const [row] = await db
		.delete(permissionActions)
		.where(eq(permissionActions.slug, slug))
		.returning();
	if (!row) return notFound(c, "Permission action");

	return c.body(null, 204);
});

export default {
	route,
	method: "DELETE" as RouteMetadata["method"],
	path: "/permission-actions/:slug",
	description: "Delete permission action (admin only)",
	auth_required: true,
	scopes: ["admin"],
};
