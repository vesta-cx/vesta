/** @format */

import { Hono } from "hono";
import { runListQuery } from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth } from "../../auth/helpers";
import { getDB } from "../../db";
import { featurePresets } from "../../db/schema";
import { forbidden } from "../../lib/errors";
import { featurePresetListConfig } from "../../services/features";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.get("/feature-presets", async (c) => {
	const auth = requireAuth(c.get("auth"));
	if (!hasScope(auth, "features:read")) {
		return forbidden(c);
	}

	const envelope = await runListQuery({
		db: getDB(c.env.DB),
		table: featurePresets,
		input: new URL(c.req.url).searchParams,
		config: featurePresetListConfig,
		mode: "envelope",
	});
	return c.json(envelope);
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/feature-presets",
	description: "List feature presets",
	auth_required: true,
	scopes: ["features:read"],
};
