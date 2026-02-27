import { and, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { parseListQuery, listResponse } from "@mia-cx/drizzle-query-factory";
import { hasScope, isAuthenticated } from "../../auth/helpers";
import { getDb } from "../../db";
import { workspaces } from "../../db/schema";
import { forbidden } from "../../lib/errors";
import {
	workspaceListConfig,
	publicWorkspaceWhere,
} from "../../services/workspaces";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.get("/workspaces", async (c) => {
	const auth = c.get("auth");
	const db = getDb(c.env.DB);
	const query = parseListQuery(new URL(c.req.url).searchParams, workspaceListConfig);

	let authWhere: ReturnType<typeof eq> | undefined;

	if (isAuthenticated(auth) && auth.scopes.includes("admin")) {
		authWhere = undefined;
	} else if (isAuthenticated(auth)) {
		if (!hasScope(auth, "workspaces:read")) {
			return forbidden(c);
		}
		authWhere = undefined;
	} else {
		authWhere = publicWorkspaceWhere();
	}

	const finalWhere = authWhere
		? query.where
			? and(authWhere, query.where)
			: authWhere
		: query.where;

	const [rows, countResult] = await Promise.all([
		db
			.select()
			.from(workspaces)
			.where(finalWhere)
			.orderBy(query.orderBy)
			.limit(query.limit)
			.offset(query.offset),
		db
			.select({ total: sql<number>`count(*)` })
			.from(workspaces)
			.where(finalWhere),
	]);
	const total = countResult[0]?.total ?? 0;

	return c.json(listResponse(rows, total, query.limit, query.offset));
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/workspaces",
	description: "List workspaces",
	auth_required: false,
	scopes: ["workspaces:read"],
};
