/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth } from "../../../auth/helpers";
import { ADMIN_SCOPE } from "../../../auth/types";
import { getDB } from "../../../db";
import { posts } from "../../../db/schema";
import { forbidden, notFound } from "../../../lib/errors";
import { canReadResource } from "../../../services/resources";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();
const PATH = "/resources/:resourceId/post" as const;

route.get(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	if (!hasScope(auth, "resources:read")) return forbidden(c);

	const db = getDB(c.env.DB);
	const resourceId = c.req.param("resourceId");
	if (!(await canReadResource(db, auth, resourceId))) {
		return notFound(c, "Resource");
	}

	const [row] = await db
		.select({
			resourceId: posts.resourceId,
			body: posts.body,
			bodyHtml: posts.bodyHtml,
			featuredImage: posts.featuredImage,
			createdAt: posts.createdAt,
			updatedAt: posts.updatedAt,
		})
		.from(posts)
		.where(eq(posts.resourceId, resourceId))
		.limit(1);

	return row ? c.json(itemResponse(row)) : notFound(c, "Post");
});

export default {
	route,
	method: "GET" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Get resource post",
	auth_required: true,
	scopes: ["resources:read"],
	scopes_any: [ADMIN_SCOPE, "resources:read"],
};
