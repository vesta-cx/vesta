import { sql } from "drizzle-orm";
import { Hono } from "hono";
import {
	parseListQuery,
	listResponse,
} from "@mia-cx/drizzle-query-factory";
import { requireScope } from "../../auth/helpers";
import { getDb } from "../../db";
import { permissionActions } from "../../db/schema";
import { permissionActionListConfig } from "../../services/permissions";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.get("/permission-actions", async (c) => {
	const auth = c.get("auth");
	requireScope(auth, "permissions:read");

	const db = getDb(c.env.DB);
	const query = parseListQuery(
		new URL(c.req.url).searchParams,
		permissionActionListConfig,
	);

	const whereClause = query.where ?? sql`1=1`;

	const [rows, countResult] = await Promise.all([
		db
			.select()
			.from(permissionActions)
			.where(whereClause)
			.orderBy(query.orderBy)
			.limit(query.limit)
			.offset(query.offset),
		db
			.select({ total: sql<number>`count(*)` })
			.from(permissionActions)
			.where(whereClause),
	]);

	return c.json(
		listResponse(rows, countResult[0]?.total ?? 0, query.limit, query.offset),
	);
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/permission-actions",
	description: "List permission actions",
	auth_required: true,
	scopes: ["permissions:read"],
};
