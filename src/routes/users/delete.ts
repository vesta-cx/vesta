/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { requireAuth } from "../../auth/helpers";
import { getDB } from "../../db";
import { users } from "../../db/schema";
import { forbidden, notFound } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.delete("/users/:id", async (c) => {
	const auth = requireAuth(c.get("auth"));
	if (!auth.scopes.includes("admin")) {
		return forbidden(c, "Forbidden: admin scope required");
	}

	const id = c.req.param("id");
	const db = getDB(c.env.DB);
	const [row] = await db
		.delete(users)
		.where(eq(users.workosUserId, id))
		.returning();

	if (!row) return notFound(c, "User");
	return c.body(null, 204);
});

export default {
	route,
	method: "DELETE" as RouteMetadata["method"],
	path: "/users/:id",
	description: "Delete user (admin only)",
	auth_required: true,
	scopes: ["admin"],
};
