/** @format */

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { isAuthenticated, requireAuth } from "../../auth/helpers";
import { getDB } from "../../db";
import { resources } from "../../db/schema";
import { forbidden, notFound } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.delete("/resources/:id", async (c) => {
	const auth = requireAuth(c.get("auth"));
	const id = c.req.param("id");
	const db = getDB(c.env.DB);

	const isAdmin = auth.scopes.includes("admin");
	if (!isAdmin && !auth.scopes.includes("resources:write")) {
		return forbidden(c);
	}

	const where =
		isAdmin ?
			eq(resources.id, id)
		:	and(eq(resources.id, id), eq(resources.ownerId, auth.subjectId));

	const [row] = await db.delete(resources).where(where).returning();
	if (!row) return notFound(c, "Resource");

	return c.body(null, 204);
});

export default {
	route,
	method: "DELETE" as RouteMetadata["method"],
	path: "/resources/:id",
	description: "Delete resource",
	auth_required: true,
	scopes: ["resources:write"],
};
