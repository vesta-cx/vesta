/** @format */

import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { parseListQuery, listResponse } from "@mia-cx/drizzle-query-factory";
import { hasScope, isAuthenticated } from "../../auth/helpers";
import { getDB } from "../../db";
import { users } from "../../db/schema";
import { forbidden } from "../../lib/errors";
import { userListConfig, PUBLIC_USER_FIELDS } from "../../services/users";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.get("/users", async (c) => {
	const auth = c.get("auth");
	const db = getDB(c.env.DB);
	const query = parseListQuery(
		new URL(c.req.url).searchParams,
		userListConfig,
	);

	if (isAuthenticated(auth) && auth.scopes.includes("admin")) {
		const finalWhere = query.where;
		const [rows, countResult] = await Promise.all([
			db
				.select()
				.from(users)
				.where(finalWhere)
				.orderBy(query.orderBy)
				.limit(query.limit)
				.offset(query.offset),
			db
				.select({ total: sql<number>`count(*)` })
				.from(users)
				.where(finalWhere),
		]);
		const total = countResult[0]?.total ?? 0;
		return c.json(
			listResponse(rows, total, query.limit, query.offset),
		);
	}

	if (isAuthenticated(auth)) {
		if (!hasScope(auth, "users:read")) {
			return forbidden(c);
		}
		const finalWhere = query.where;
		const [rows, countResult] = await Promise.all([
			db
				.select()
				.from(users)
				.where(finalWhere)
				.orderBy(query.orderBy)
				.limit(query.limit)
				.offset(query.offset),
			db
				.select({ total: sql<number>`count(*)` })
				.from(users)
				.where(finalWhere),
		]);
		const total = countResult[0]?.total ?? 0;
		return c.json(
			listResponse(rows, total, query.limit, query.offset),
		);
	}

	const finalWhere = query.where;
	const [rows, countResult] = await Promise.all([
		db
			.select(PUBLIC_USER_FIELDS)
			.from(users)
			.where(finalWhere)
			.orderBy(query.orderBy)
			.limit(query.limit)
			.offset(query.offset),
		db
			.select({ total: sql<number>`count(*)` })
			.from(users)
			.where(finalWhere),
	]);
	const total = countResult[0]?.total ?? 0;
	return c.json(listResponse(rows, total, query.limit, query.offset));
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/users",
	description: "List users",
	auth_required: false,
	scopes: ["users:read"],
};
