/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth } from "../../../auth/helpers";
import { getDB } from "../../../db";
import { posts } from "../../../db/schema";
import { forbidden, notFound } from "../../../lib/errors";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();

route.get("/resources/:resourceId/post", async (c) => {
	const auth = requireAuth(c.get("auth"));
	if (!hasScope(auth, "resources:read")) {
		return forbidden(c);
	}

	const db = getDB(c.env.DB);
	const resourceId = c.req.param("resourceId");

	const [row] = await db
		.select()
		.from(posts)
		.where(eq(posts.resourceId, resourceId))
		.limit(1);

	return row ? c.json(itemResponse(row)) : notFound(c, "Post");
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/resources/:resourceId/post",
	description: "Get resource post",
	auth_required: true,
	scopes: ["resources:read"],
};
