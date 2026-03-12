/** @format */

import { Hono } from "hono";
import { runListQuery } from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth } from "../../auth/helpers";
import { getDB } from "../../db";
import { teams } from "../../db/schema";
import { forbidden } from "../../lib/errors";
import { teamListConfig } from "../../services/teams";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.get("/teams", async (c) => {
	const auth = requireAuth(c.get("auth"));
	if (!hasScope(auth, "teams:read")) return forbidden(c);

	const envelope = await runListQuery({
		db: getDB(c.env.DB),
		table: teams,
		input: new URL(c.req.url).searchParams,
		config: teamListConfig,
		mode: "envelope",
	});
	return c.json(envelope);
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/teams",
	description: "List teams",
	auth_required: true,
	scopes: ["teams:read"],
};
