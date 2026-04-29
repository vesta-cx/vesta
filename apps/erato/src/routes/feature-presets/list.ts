/** @format */

import { Hono } from "hono";
import { runListQuery } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope } from "../../auth/helpers";
import { ADMIN_SCOPE } from "../../auth/types";
import { getDB } from "../../db";
import { featurePresets } from "../../db/schema";
import { featurePresetListConfig } from "../../services/features";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/feature-presets" as const;

route.get(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "features:read");

	const envelope = await runListQuery({
		db: getDB(c.env.DB),
		table: featurePresets,
		input: new URLSearchParams(
			c.req.query() as Record<string, string>,
		),
		config: featurePresetListConfig,
		mode: "envelope",
	});
	return c.json(envelope);
});

export default {
	route,
	method: "GET" satisfies RouteMetadata["method"],
	path: PATH,
	description: "List feature presets",
	auth_required: true,
	scopes: ["features:read"],
	scopes_any: [ADMIN_SCOPE, "features:read"],
};
