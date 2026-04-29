/** @format */

import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { parseListQuery, listResponse } from "@mia-cx/drizzle-query-factory";
import { ADMIN_SCOPE } from "../../auth/types";
import { hasScope, requireAuth } from "../../auth/helpers";
import { getDB } from "../../db";
import { users } from "../../db/schema";
import { forbidden } from "../../lib/errors";
import { userListConfig, PUBLIC_USER_FIELDS } from "../../services/users";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/users" as const;
const countAll = sql<string | number>`count(*)`;

route.get(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	const db = getDB(c.env.DB);
	const query = parseListQuery(
		new URLSearchParams(c.req.query() as Record<string, string>),
		userListConfig,
	);
	const isAdmin = hasScope(auth, ADMIN_SCOPE);

	if (!isAdmin && !hasScope(auth, "users:read")) return forbidden(c);

	const finalWhere = query.where;
	const [rows, countResult] = await Promise.all([
		isAdmin ?
			db
				.select()
				.from(users)
				.where(finalWhere)
				.orderBy(query.orderBy)
				.limit(query.limit)
				.offset(query.offset)
		:	db
				.select(PUBLIC_USER_FIELDS)
				.from(users)
				.where(finalWhere)
				.orderBy(query.orderBy)
				.limit(query.limit)
				.offset(query.offset),
		db.select({ total: countAll }).from(users).where(finalWhere),
	]);
	const total = Number(countResult[0]?.total ?? 0);
	return c.json(listResponse(rows, total, query.limit, query.offset));
});

export default {
	route,
	method: "GET" satisfies RouteMetadata["method"],
	path: PATH,
	description: "List users",
	auth_required: true,
	scopes_any: [ADMIN_SCOPE, "users:read"],
};
