/** @format */

import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { parseListQuery, listResponse } from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth } from "../../auth/helpers";
import { getDB } from "../../db";
import { workspaces } from "../../db/schema";
import { forbidden } from "../../lib/errors";
import { workspaceListConfig } from "../../services/workspaces";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.get("/workspaces", async (c) => {
	const auth = requireAuth(c.get("auth"));
	const db = getDB(c.env.DB);
	const query = parseListQuery(
		new URL(c.req.url).searchParams,
		workspaceListConfig,
	);

	if (!hasScope(auth, "workspaces:read")) {
		return forbidden(c);
	}

	const [rows, countResult] = await Promise.all([
		db
			.select()
			.from(workspaces)
			.where(query.where)
			.orderBy(query.orderBy)
			.limit(query.limit)
			.offset(query.offset),
		db
			.select({ total: sql<number>`count(*)` })
			.from(workspaces)
			.where(query.where),
	]);
	const total = countResult[0]?.total ?? 0;

	return c.json(listResponse(rows, total, query.limit, query.offset));
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/workspaces",
	description: "List workspaces",
	auth_required: true,
	scopes: ["workspaces:read"],
};
