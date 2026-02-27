/** @format */

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { requireScope } from "../../../auth/helpers";
import { getDB } from "../../../db";
import { resourceUrls } from "../../../db/schema";
import { notFound } from "../../../lib/errors";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();

route.delete("/resources/:resourceId/urls/:position", async (c) => {
	const auth = c.get("auth");
	requireScope(auth, "resources:write");

	const db = getDB(c.env.DB);
	const resourceId = c.req.param("resourceId");
	const position = parseInt(c.req.param("position"), 10);

	const [row] = await db
		.delete(resourceUrls)
		.where(
			and(
				eq(resourceUrls.resourceId, resourceId),
				eq(resourceUrls.position, position),
			),
		)
		.returning();

	if (!row) return notFound(c, "Resource URL");
	return c.body(null, 204);
});

export default {
	route,
	method: "DELETE" as RouteMetadata["method"],
	path: "/resources/:resourceId/urls/:position",
	description: "Remove resource URL",
	auth_required: true,
	scopes: ["resources:write"],
};
