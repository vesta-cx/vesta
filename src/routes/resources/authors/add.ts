/** @format */

import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireScope } from "../../../auth/helpers";
import { getDB } from "../../../db";
import { resourceAuthors } from "../../../db/schema";
import { conflict } from "../../../lib/errors";
import { parseBody, isResponse, z } from "../../../lib/validation";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const addAuthorSchema = z.object({
	authorType: z.string().min(1),
	authorId: z.string().min(1),
	role: z.string().nullable().optional(),
});

const route = new Hono<AppEnv>();

route.post("/resources/:resourceId/authors", async (c) => {
	const auth = c.get("auth");
	requireScope(auth, "resources:write");

	const parsed = await parseBody(c, addAuthorSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDB(c.env.DB);
	const resourceId = c.req.param("resourceId");

	try {
		const [row] = await db
			.insert(resourceAuthors)
			.values({ resourceId, ...parsed })
			.returning();
		return c.json(itemResponse(row!), 201);
	} catch (err) {
		if (err instanceof Error && /UNIQUE/i.test(err.message)) {
			return conflict(
				c,
				"Author already linked to this resource",
			);
		}
		throw err;
	}
});

export default {
	route,
	method: "POST" as RouteMetadata["method"],
	path: "/resources/:resourceId/authors",
	description: "Add author to resource",
	auth_required: true,
	scopes: ["resources:write"],
};
