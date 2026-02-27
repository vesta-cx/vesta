/** @format */

import { Hono } from "hono";
import { runListQuery } from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth } from "../../auth/helpers";
import { getDB } from "../../db";
import { engagements } from "../../db/schema";
import { forbidden } from "../../lib/errors";
import { engagementListConfig } from "../../services/engagements";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.get("/engagements", async (c) => {
	const auth = c.get("auth");
	requireAuth(auth);
	if (!hasScope(auth, "engagements:read")) return forbidden(c);

	const envelope = await runListQuery({
		db: getDB(c.env.DB),
		table: engagements,
		input: new URL(c.req.url).searchParams,
		config: engagementListConfig,
		mode: "envelope",
	});
	return c.json(envelope);
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/engagements",
	description: "List engagements",
	auth_required: true,
	scopes: ["engagements:read"],
};
