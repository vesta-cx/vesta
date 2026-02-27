import { sql } from "drizzle-orm";
import { Hono } from "hono";
import {
	parseListQuery,
	listResponse,
} from "@mia-cx/drizzle-query-factory";
import { hasScope, isAuthenticated } from "../../auth/helpers";
import { getDb } from "../../db";
import { featurePresets } from "../../db/schema";
import { forbidden } from "../../lib/errors";
import { featurePresetListConfig } from "../../services/features";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.get("/feature-presets", async (c) => {
	const auth = c.get("auth");
	if (isAuthenticated(auth) && !hasScope(auth, "features:read")) {
		return forbidden(c);
	}

	const db = getDb(c.env.DB);
	const query = parseListQuery(
		new URL(c.req.url).searchParams,
		featurePresetListConfig,
	);

	const whereClause = query.where ?? sql`1=1`;

	const [rows, countResult] = await Promise.all([
		db
			.select()
			.from(featurePresets)
			.where(whereClause)
			.orderBy(query.orderBy)
			.limit(query.limit)
			.offset(query.offset),
		db
			.select({ total: sql<number>`count(*)` })
			.from(featurePresets)
			.where(whereClause),
	]);
	const total = countResult[0]?.total ?? 0;
	return c.json(listResponse(rows, total, query.limit, query.offset));
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/feature-presets",
	description: "List feature presets",
	auth_required: false,
	scopes: ["features:read"],
};
