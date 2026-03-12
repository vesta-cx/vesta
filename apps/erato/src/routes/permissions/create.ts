/** @format */

import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope } from "../../auth/helpers";
import { getDB } from "../../db";
import { permissions } from "../../db/schema";
import { conflict } from "../../lib/errors";
import { parseBody, isResponse } from "../../lib/validation";
import { createPermissionSchema } from "../../services/permissions";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.post("/permissions", async (c) => {
	const auth = requireAuth(c.get("auth"));

	requireScope(auth, "permissions:write");

	const parsed = await parseBody(c, createPermissionSchema);
	if (isResponse(parsed)) return parsed;

	if (parsed.objectType === "collection") {
		requireScope(auth, "collections:write");
	}

	const db = getDB(c.env.DB);
	try {
		const [row] = await db
			.insert(permissions)
			.values(parsed)
			.returning();
		return c.json(itemResponse(row!), 201);
	} catch (err) {
		if (
			err instanceof Error &&
			/UNIQUE|FOREIGN KEY/i.test(err.message)
		) {
			return conflict(c, "Permission constraint violated");
		}
		throw err;
	}
});

export default {
	route,
	method: "POST" as RouteMetadata["method"],
	path: "/permissions",
	description: "Create permission",
	auth_required: true,
	scopes: ["permissions:write"],
};
