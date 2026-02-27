import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireScope } from "../../auth/helpers";
import { getDb } from "../../db";
import { resources } from "../../db/schema";
import { conflict } from "../../lib/errors";
import { parseBody, isResponse } from "../../lib/validation";
import { createResourceSchema } from "../../services/resources";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.post("/resources", async (c) => {
	const auth = c.get("auth");
	requireScope(auth, "resources:write");

	const parsed = await parseBody(c, createResourceSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDb(c.env.DB);
	try {
		const [row] = await db.insert(resources).values(parsed).returning();
		return c.json(itemResponse(row!), 201);
	} catch (err) {
		if (err instanceof Error && /UNIQUE/i.test(err.message)) {
			return conflict(c, "Resource already exists");
		}
		throw err;
	}
});

export default {
	route,
	method: "POST" as RouteMetadata["method"],
	path: "/resources",
	description: "Create resource",
	auth_required: true,
	scopes: ["resources:write"],
};
