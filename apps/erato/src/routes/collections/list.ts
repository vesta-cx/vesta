/** @format */

import { and, sql } from "drizzle-orm";
import { Hono } from "hono";
import { parseListQuery, listResponse } from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth } from "../../auth/helpers";
import { ADMIN_SCOPE } from "../../auth/types";
import { getDB } from "../../db";
import { collections } from "../../db/schema";
import { forbidden } from "../../lib/errors";
import {
	collectionAccessWhere,
	collectionListConfig,
} from "../../services/collections";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/collections" as const;
const countAll = sql<string | number>`count(*)`;

route.get(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	if (!hasScope(auth, "collections:read")) return forbidden(c);

	const db = getDB(c.env.DB);
	const query = parseListQuery(
		new URLSearchParams(c.req.query() as Record<string, string>),
		collectionListConfig,
	);

	const authWhere =
		hasScope(auth, ADMIN_SCOPE) ? undefined : (
			collectionAccessWhere(db, auth, collections.id)
		);
	const finalWhere =
		authWhere && query.where ? and(authWhere, query.where)
		: authWhere ? authWhere
		: query.where;

	const [rows, countResult] = await Promise.all([
		db
			.select()
			.from(collections)
			.where(finalWhere)
			.orderBy(query.orderBy)
			.limit(query.limit)
			.offset(query.offset),
		db
			.select({ total: countAll })
			.from(collections)
			.where(finalWhere),
	]);

	return c.json(
		listResponse(
			rows,
			Number(countResult[0]?.total ?? 0),
			query.limit,
			query.offset,
		),
	);
});

export default {
	route,
	method: "GET" satisfies RouteMetadata["method"],
	path: PATH,
	description: "List collections",
	auth_required: true,
	scopes: ["collections:read"],
	scopes_any: [ADMIN_SCOPE, "collections:read"],
};
