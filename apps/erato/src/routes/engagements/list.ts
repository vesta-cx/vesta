/** @format */

import { Hono } from "hono";
import { runListQuery } from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth } from "../../auth/helpers";
import { ADMIN_SCOPE } from "../../auth/types";
import { getDB } from "../../db";
import { engagements } from "../../db/schema";
import { forbidden } from "../../lib/errors";
import { engagementListConfig } from "../../services/engagements";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/engagements" as const;

route.get(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	if (!hasScope(auth, "engagements:read")) return forbidden(c);

	const envelope = await runListQuery({
		db: getDB(c.env.DB),
		table: engagements,
		input: new URLSearchParams(
			c.req.query() as Record<string, string>,
		),
		config: engagementListConfig,
		mode: "envelope",
	});
	return c.json(envelope);
});

export default {
	route,
	method: "GET" satisfies RouteMetadata["method"],
	path: PATH,
	description: "List engagements",
	auth_required: true,
	scopes: ["engagements:read"],
	scopes_any: [ADMIN_SCOPE, "engagements:read"],
};
