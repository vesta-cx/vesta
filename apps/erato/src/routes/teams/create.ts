/** @format */

import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope } from "../../auth/helpers";
import { ADMIN_SCOPE } from "../../auth/types";
import { getDB } from "../../db";
import { teams } from "../../db/schema";
import { expectOne } from "../../lib/db-helpers";
import { parseBody, isResponse } from "../../lib/validation";
import { createTeamSchema } from "../../services/teams";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/teams" as const;

route.post(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "teams:write");

	const parsed = await parseBody(c, createTeamSchema);
	if (isResponse(parsed)) return parsed;

	const rows = await getDB(c.env.DB)
		.insert(teams)
		.values(parsed)
		.returning();
	return c.json(itemResponse(expectOne(rows, "Team insert")), 201);
});

export default {
	route,
	method: "POST" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Create team",
	auth_required: true,
	scopes: ["teams:write"],
	scopes_any: [ADMIN_SCOPE, "teams:write"],
};
