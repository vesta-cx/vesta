/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { ADMIN_SCOPE } from "../../auth/types";
import { requireAuth, requireScope } from "../../auth/helpers";
import { getDB } from "../../db";
import { permissionActions } from "../../db/schema";
import { conflict, notFound } from "../../lib/errors";
import { isUniqueConstraintError } from "../../lib/db-helpers";
import { parseBody, isResponse } from "../../lib/validation";
import { updatePermissionActionSchema } from "../../services/permissions";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/permission-actions/:slug" as const;

route.put(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, ADMIN_SCOPE);

	const slug = c.req.param("slug");
	const parsed = await parseBody(c, updatePermissionActionSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDB(c.env.DB);
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
		if (isUniqueConstraintError(err)) {
			return conflict(
				c,
				"Permission action update conflicts with an existing row",
			);
		}
		throw err;
	}
});

export default {
	route,
	method: "PUT" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Update permission action (admin only)",
	auth_required: true,
	scopes: [ADMIN_SCOPE],
};
