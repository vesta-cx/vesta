import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireScope } from "../../auth/helpers";
import { getDb } from "../../db";
import { permissions } from "../../db/schema";
import { conflict } from "../../lib/errors";
import { parseBody, isResponse } from "../../lib/validation";
import { createPermissionSchema } from "../../services/permissions";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.post("/permissions", async (c) => {
	const auth = c.get("auth");
	requireScope(auth, "permissions:write");

	const parsed = await parseBody(c, createPermissionSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDb(c.env.DB);
	try {
		const [row] = await db.insert(permissions).values(parsed).returning();
		return c.json(itemResponse(row!), 201);
	} catch (err) {
		if (err instanceof Error && /UNIQUE|FOREIGN KEY/i.test(err.message)) {
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
