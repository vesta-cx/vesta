/** @format */

import { Hono } from "hono";
import { runListQuery } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope } from "../../auth/helpers";
import { ADMIN_SCOPE } from "../../auth/types";
import { getDB } from "../../db";
import { teams } from "../../db/schema";
import { teamListConfig } from "../../services/teams";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/teams" as const;

route.get(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "teams:read");

	const envelope = await runListQuery({
		db: getDB(c.env.DB),
		table: teams,
		input: new URLSearchParams(
			c.req.query() as Record<string, string>,
		),
		config: teamListConfig,
		mode: "envelope",
	});
	return c.json(envelope);
});

export default {
	route,
	method: "GET" satisfies RouteMetadata["method"],
	path: PATH,
	description: "List teams",
	auth_required: true,
	scopes: ["teams:read"],
	scopes_any: [ADMIN_SCOPE, "teams:read"],
};
