/** @format */

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { isAuthenticated, requireScope } from "../../auth/helpers";
import { getDB } from "../../db";
import { resources } from "../../db/schema";
import { conflict, forbidden, notFound } from "../../lib/errors";
import { parseBody, isResponse } from "../../lib/validation";
import { updateResourceSchema } from "../../services/resources";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.put("/resources/:id", async (c) => {
	const auth = c.get("auth");
	requireScope(auth, "resources:write");

	const id = c.req.param("id");
	const parsed = await parseBody(c, updateResourceSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDB(c.env.DB);

	const isAdmin = isAuthenticated(auth) && auth.scopes.includes("admin");
	const where =
		isAdmin ?
			eq(resources.id, id)
		:	and(
				eq(resources.id, id),
				eq(
					resources.ownerId,
					(auth as { subjectId: string }).subjectId,
				),
			);

	try {
		const [row] = await db
			.update(resources)
			.set({ ...parsed, updatedAt: new Date() })
			.where(where)
			.returning();
		return row ?
				c.json(itemResponse(row))
			:	notFound(c, "Resource");
	} catch (err) {
		if (err instanceof Error && /UNIQUE/i.test(err.message)) {
			return conflict(c, "Conflict on update");
		}
		throw err;
	}
});

export default {
	route,
	method: "PUT" as RouteMetadata["method"],
	path: "/resources/:id",
	description: "Update resource",
	auth_required: true,
	scopes: ["resources:write"],
};
