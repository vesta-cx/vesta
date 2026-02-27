import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { parseListQuery, listResponse } from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth } from "../../auth/helpers";
import { getDb } from "../../db";
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

	const db = getDb(c.env.DB);
	const query = parseListQuery(new URL(c.req.url).searchParams, engagementListConfig);

	const [rows, countResult] = await Promise.all([
		db
			.select()
			.from(engagements)
			.where(query.where)
			.orderBy(query.orderBy)
			.limit(query.limit)
			.offset(query.offset),
		db
			.select({ total: sql<number>`count(*)` })
			.from(engagements)
			.where(query.where),
	]);
	const total = countResult[0]?.total ?? 0;

	return c.json(listResponse(rows, total, query.limit, query.offset));
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/engagements",
	description: "List engagements",
	auth_required: true,
	scopes: ["engagements:read"],
};
