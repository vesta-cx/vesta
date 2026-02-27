import type { SQL } from "drizzle-orm";
import { and, sql } from "drizzle-orm";
import { Hono } from "hono";
import {
	parseListQuery,
	listResponse,
} from "@mia-cx/drizzle-query-factory";
import { hasScope, isAuthenticated } from "../../auth/helpers";
import { getDb } from "../../db";
import { collections } from "../../db/schema";
import { forbidden } from "../../lib/errors";
import {
	collectionListConfig,
	publicCollectionWhere,
} from "../../services/collections";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.get("/collections", async (c) => {
	const auth = c.get("auth");
	const db = getDb(c.env.DB);
	const query = parseListQuery(
		new URL(c.req.url).searchParams,
		collectionListConfig,
	);

	let authWhere: SQL | undefined = publicCollectionWhere();
	if (isAuthenticated(auth)) {
		if (!hasScope(auth, "collections:read") && !auth.scopes.includes("admin")) {
			return forbidden(c);
		}
		if (hasScope(auth, "collections:read") || auth.scopes.includes("admin")) {
			authWhere = undefined;
		}
	}

	const finalWhere = authWhere
		? query.where
			? and(authWhere, query.where)
			: authWhere
		: query.where;

	const whereClause = finalWhere ?? sql`1=1`;

	const [rows, countResult] = await Promise.all([
		db
			.select()
			.from(collections)
			.where(whereClause)
			.orderBy(query.orderBy)
			.limit(query.limit)
			.offset(query.offset),
		db
			.select({ total: sql<number>`count(*)` })
			.from(collections)
			.where(whereClause),
	]);
	return c.json(
		listResponse(rows, countResult[0]?.total ?? 0, query.limit, query.offset),
	);
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/collections",
	description: "List collections",
	auth_required: false,
	scopes: ["collections:read"],
};
