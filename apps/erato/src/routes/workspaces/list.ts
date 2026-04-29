/** @format */

import { and, sql } from "drizzle-orm";
import { Hono } from "hono";
import { parseListQuery, listResponse } from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth } from "../../auth/helpers";
import { ADMIN_SCOPE } from "../../auth/types";
import { getDB } from "../../db";
import { workspaces } from "../../db/schema";
import { forbidden } from "../../lib/errors";
import {
	workspaceAccessWhere,
	workspaceListConfig,
} from "../../services/workspaces";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/workspaces" as const;
const countAll = sql<string | number>`count(*)`;

route.get(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	if (!hasScope(auth, "workspaces:read")) return forbidden(c);

	const db = getDB(c.env.DB);
	const query = parseListQuery(
		new URLSearchParams(c.req.query() as Record<string, string>),
		workspaceListConfig,
	);

	const authWhere =
		hasScope(auth, ADMIN_SCOPE) ? undefined : (
			workspaceAccessWhere(db, auth, workspaces.id)
		);
	const finalWhere =
		authWhere && query.where ? and(authWhere, query.where)
		: authWhere ? authWhere
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
			.select({ total: countAll })
			.from(workspaces)
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
	description: "List workspaces",
	auth_required: true,
	scopes: ["workspaces:read"],
	scopes_any: [ADMIN_SCOPE, "workspaces:read"],
};
