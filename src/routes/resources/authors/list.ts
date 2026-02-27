import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { hasScope, isAuthenticated } from "../../../auth/helpers";
import { getDb } from "../../../db";
import { resourceAuthors } from "../../../db/schema";
import { forbidden } from "../../../lib/errors";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();

route.get("/resources/:resourceId/authors", async (c) => {
	const auth = c.get("auth");
	if (isAuthenticated(auth) && !hasScope(auth, "resources:read")) {
		return forbidden(c);
	}

	const db = getDb(c.env.DB);
	const resourceId = c.req.param("resourceId");

	const rows = await db
		.select()
		.from(resourceAuthors)
		.where(eq(resourceAuthors.resourceId, resourceId));

	return c.json({ data: rows });
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/resources/:resourceId/authors",
	description: "List resource authors",
	auth_required: false,
	scopes: ["resources:read"],
};
