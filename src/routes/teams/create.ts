/** @format */

import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireScope } from "../../auth/helpers";
import { getDB } from "../../db";
import { teams } from "../../db/schema";
import { parseBody, isResponse } from "../../lib/validation";
import { createTeamSchema } from "../../services/teams";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.post("/teams", async (c) => {
	const auth = c.get("auth");
	requireScope(auth, "teams:write");

	const parsed = await parseBody(c, createTeamSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDB(c.env.DB);

	const [row] = await db
		.insert(teams)
		.values({
			name: parsed.name,
			ownerId: parsed.ownerId,
			organizationId: parsed.organizationId,
		})
		.returning();

	return c.json(itemResponse(row!), 201);
});

export default {
	route,
	method: "POST" as RouteMetadata["method"],
	path: "/teams",
	description: "Create team",
	auth_required: true,
	scopes: ["teams:write"],
};
