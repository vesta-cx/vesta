/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { requireScope } from "../../../auth/helpers";
import { getDB } from "../../../db";
import { posts } from "../../../db/schema";
import { notFound } from "../../../lib/errors";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();

route.delete("/resources/:resourceId/post", async (c) => {
	const auth = c.get("auth");
	requireScope(auth, "resources:write");

	const db = getDB(c.env.DB);
	const resourceId = c.req.param("resourceId");

	const [row] = await db
		.delete(posts)
		.where(eq(posts.resourceId, resourceId))
		.returning();

	if (!row) return notFound(c, "Post");
	return c.body(null, 204);
});

export default {
	route,
	method: "DELETE" as RouteMetadata["method"],
	path: "/resources/:resourceId/post",
	description: "Delete resource post",
	auth_required: true,
	scopes: ["resources:write"],
};
