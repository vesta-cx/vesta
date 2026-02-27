/** @format */

import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope } from "../../auth/helpers";
import { getDB } from "../../db";
import { permissionActions } from "../../db/schema";
import { conflict } from "../../lib/errors";
import { parseBody, isResponse } from "../../lib/validation";
import { createPermissionActionSchema } from "../../services/permissions";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.post("/permission-actions", async (c) => {
	const auth = requireAuth(c.get("auth"));

	requireScope(auth, "admin");

	const parsed = await parseBody(c, createPermissionActionSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDB(c.env.DB);
	try {
		const [row] = await db
			.insert(permissionActions)
			.values(parsed)
			.returning();
		return c.json(itemResponse(row!), 201);
	} catch (err) {
		if (err instanceof Error && /UNIQUE/i.test(err.message)) {
			return conflict(c, "Permission action already exists");
		}
		throw err;
	}
});

export default {
	route,
	method: "POST" as RouteMetadata["method"],
	path: "/permission-actions",
	description: "Create permission action (admin only)",
	auth_required: true,
	scopes: ["admin"],
};
