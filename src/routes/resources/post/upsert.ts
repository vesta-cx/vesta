/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope } from "../../../auth/helpers";
import { getDB } from "../../../db";
import { posts } from "../../../db/schema";
import { parseBody, isResponse, z } from "../../../lib/validation";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const upsertPostSchema = z.object({
	body: z.string().min(1),
	bodyHtml: z.string().nullable().optional(),
	featuredImage: z.string().url().nullable().optional(),
});

const route = new Hono<AppEnv>();

route.put("/resources/:resourceId/post", async (c) => {
	const auth = requireAuth(c.get("auth"));

	requireScope(auth, "resources:write");

	const parsed = await parseBody(c, upsertPostSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDB(c.env.DB);
	const resourceId = c.req.param("resourceId");

	const [existing] = await db
		.select()
		.from(posts)
		.where(eq(posts.resourceId, resourceId))
		.limit(1);

	if (existing) {
		const [row] = await db
			.update(posts)
			.set(parsed)
			.where(eq(posts.resourceId, resourceId))
			.returning();
		return c.json(itemResponse(row!));
	}

	const [row] = await db
		.insert(posts)
		.values({ resourceId, ...parsed })
		.returning();
	return c.json(itemResponse(row!), 201);
});

export default {
	route,
	method: "PUT" as RouteMetadata["method"],
	path: "/resources/:resourceId/post",
	description: "Create or update resource post",
	auth_required: true,
	scopes: ["resources:write"],
};
