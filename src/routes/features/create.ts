/** @format */

import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, hasScope } from "../../auth/helpers";
import { getDB } from "../../db";
import { features } from "../../db/schema";
import { conflict, forbidden } from "../../lib/errors";
import { parseBody, isResponse } from "../../lib/validation";
import { createFeatureSchema } from "../../services/features";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.post("/features", async (c) => {
	const auth = requireAuth(c.get("auth"));
	if (!hasScope(auth, "admin")) return forbidden(c);

	const parsed = await parseBody(c, createFeatureSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDB(c.env.DB);
	try {
		const [row] = await db
			.insert(features)
			.values(parsed as any)
			.returning();
		return c.json(itemResponse(row!), 201);
	} catch (err) {
		if (err instanceof Error && /UNIQUE/i.test(err.message)) {
			return conflict(c, "Feature already exists");
		}
		throw err;
	}
});

export default {
	route,
	method: "POST" as RouteMetadata["method"],
	path: "/features",
	description: "Create feature",
	auth_required: true,
	scopes: ["admin"],
};
