/** @format */

import { Hono } from "hono";
import { runListQuery } from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth } from "../../auth/helpers";
import { getDB } from "../../db";
import { features } from "../../db/schema";
import { forbidden } from "../../lib/errors";
import { featureListConfig } from "../../services/features";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.get("/features", async (c) => {
	const auth = requireAuth(c.get("auth"));
	if (!hasScope(auth, "features:read")) {
		return forbidden(c);
	}

	const envelope = await runListQuery({
		db: getDB(c.env.DB),
		table: features,
		input: new URL(c.req.url).searchParams,
		config: featureListConfig,
		mode: "envelope",
	});
	return c.json(envelope);
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/features",
	description: "List features",
	auth_required: true,
	scopes: ["features:read"],
};
