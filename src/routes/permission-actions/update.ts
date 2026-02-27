/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireScope } from "../../auth/helpers";
import { getDB } from "../../db";
import { permissionActions } from "../../db/schema";
import { conflict, notFound } from "../../lib/errors";
import { parseBody, isResponse } from "../../lib/validation";
import { updatePermissionActionSchema } from "../../services/permissions";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.put("/permission-actions/:slug", async (c) => {
	const auth = c.get("auth");
	requireScope(auth, "admin");

	const slug = c.req.param("slug");
	const parsed = await parseBody(c, updatePermissionActionSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDB(c.env.DB);
	const [existing] = await db
		.select()
		.from(permissionActions)
		.where(eq(permissionActions.slug, slug))
		.limit(1);
	if (!existing) return notFound(c, "Permission action");

	try {
		const [row] = await db
			.update(permissionActions)
			.set({ ...parsed, updatedAt: new Date() })
			.where(eq(permissionActions.slug, slug))
			.returning();
		return row ?
				c.json(itemResponse(row))
			:	notFound(c, "Permission action");
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
	path: "/permission-actions/:slug",
	description: "Update permission action (admin only)",
	auth_required: true,
	scopes: ["admin"],
};
