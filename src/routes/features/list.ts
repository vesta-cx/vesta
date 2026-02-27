import { sql } from "drizzle-orm";
import { Hono } from "hono";
import {
	parseListQuery,
	listResponse,
} from "@mia-cx/drizzle-query-factory";
import { hasScope, isAuthenticated } from "../../auth/helpers";
import { getDb } from "../../db";
import { features } from "../../db/schema";
import { forbidden } from "../../lib/errors";
import { featureListConfig } from "../../services/features";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.get("/features", async (c) => {
	const auth = c.get("auth");
	const db = getDb(c.env.DB);
	const query = parseListQuery(
		new URL(c.req.url).searchParams,
		featureListConfig,
	);

	if (isAuthenticated(auth) && !hasScope(auth, "features:read")) {
		return forbidden(c);
	}

	const finalWhere = query.where;

	const whereClause = finalWhere ?? sql`1=1`;

	const [rows, countResult] = await Promise.all([
		db
			.select()
			.from(features)
			.where(whereClause)
			.orderBy(query.orderBy)
			.limit(query.limit)
			.offset(query.offset),
		db
			.select({ total: sql<number>`count(*)` })
			.from(features)
			.where(whereClause),
	]);
	const total = countResult[0]?.total ?? 0;
	return c.json(listResponse(rows, total, query.limit, query.offset));
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/features",
	description: "List features",
	auth_required: false,
	scopes: ["features:read"],
};
