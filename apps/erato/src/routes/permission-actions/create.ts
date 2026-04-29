/** @format */

import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { ADMIN_SCOPE } from "../../auth/types";
import { requireAuth, requireScope } from "../../auth/helpers";
import { getDB } from "../../db";
import { permissionActions } from "../../db/schema";
import { conflict } from "../../lib/errors";
import { expectOne, isUniqueConstraintError } from "../../lib/db-helpers";
import { parseBody, isResponse } from "../../lib/validation";
import { createPermissionActionSchema } from "../../services/permissions";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/permission-actions" as const;

route.post(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, ADMIN_SCOPE);

	const parsed = await parseBody(c, createPermissionActionSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDB(c.env.DB);
	try {
		const rows = await db
			.insert(permissionActions)
			.values(parsed)
			.returning();
		return c.json(
			itemResponse(
				expectOne(rows, "Permission action insert"),
			),
			201,
		);
	} catch (err) {
		if (isUniqueConstraintError(err)) {
			return conflict(c, "Permission action already exists");
		}
		throw err;
	}
});

export default {
	route,
	method: "POST" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Create permission action (admin only)",
	auth_required: true,
	scopes: [ADMIN_SCOPE],
};
