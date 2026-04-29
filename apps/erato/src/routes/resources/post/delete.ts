/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { requireAuth, requireScope } from "../../../auth/helpers";
import { ADMIN_SCOPE } from "../../../auth/types";
import { getDB } from "../../../db";
import { posts } from "../../../db/schema";
import { notFound } from "../../../lib/errors";
import { canMutateResource } from "../../../services/resources";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();
const PATH = "/resources/:resourceId/post" as const;

route.delete(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "resources:write");

	const db = getDB(c.env.DB);
	const resourceId = c.req.param("resourceId");
	if (!(await canMutateResource(db, auth, resourceId))) {
		return notFound(c, "Resource");
	}

	const [row] = await db
		.delete(posts)
		.where(eq(posts.resourceId, resourceId))
		.returning({ resourceId: posts.resourceId });

	if (!row) return notFound(c, "Post");
	return c.body(null, 204);
});

export default {
	route,
	method: "DELETE" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Delete resource post",
	auth_required: true,
	scopes: ["resources:write"],
	scopes_any: [ADMIN_SCOPE, "resources:write"],
};
