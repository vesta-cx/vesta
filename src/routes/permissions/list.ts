import { and, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import {
	parseListQuery,
	listResponse,
} from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope } from "../../auth/helpers";
import { getDb } from "../../db";
import { permissions } from "../../db/schema";
import { forbidden } from "../../lib/errors";
import { permissionListConfig } from "../../services/permissions";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.get("/permissions", async (c) => {
	const auth = c.get("auth");
	requireScope(auth, "permissions:read");
	const apiAuth = requireAuth(auth);

	const db = getDb(c.env.DB);
	const query = parseListQuery(
		new URL(c.req.url).searchParams,
		permissionListConfig,
	);

	const isAdmin = apiAuth.scopes.includes("admin");
	const authWhere = isAdmin ? undefined : eq(permissions.subjectId, apiAuth.userId);
	const whereClause = authWhere
		? query.where
			? and(authWhere, query.where)
			: authWhere
		: query.where ?? sql`1=1`;

	const [rows, countResult] = await Promise.all([
		db
			.select()
			.from(permissions)
			.where(whereClause)
			.orderBy(query.orderBy)
			.limit(query.limit)
			.offset(query.offset),
		db
			.select({ total: sql<number>`count(*)` })
			.from(permissions)
			.where(whereClause),
	]);

	return c.json(
		listResponse(rows, countResult[0]?.total ?? 0, query.limit, query.offset),
	);
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/permissions",
	description: "List permissions",
	auth_required: true,
	scopes: ["permissions:read"],
};
