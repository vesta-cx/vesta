/** @format */

import { and, eq, exists, or, sql } from "drizzle-orm";
import { Hono } from "hono";
import { parseListQuery, listResponse } from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth } from "../../auth/helpers";
import { getDB } from "../../db";
import {
	WORKSPACE_PERMISSION_ACTIONS,
	permissions,
	workspaces,
} from "../../db/schema";
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

	const ownerWhere =
		auth.subjectType === "user" || auth.subjectType === "organization" ?
			and(
				eq(workspaces.ownerType, auth.subjectType),
				eq(workspaces.ownerId, auth.subjectId),
			)
		:	undefined;

	const permissionSubjectType =
		auth.subjectType === "user" || auth.subjectType === "organization" ?
			auth.subjectType
		:	undefined;
	const explicitAllowWhere =
		permissionSubjectType ?
			exists(
				db
					.select({ id: permissions.id })
					.from(permissions)
					.where(
						and(
							eq(
								permissions.subjectType,
								permissionSubjectType,
							),
							eq(permissions.subjectId, auth.subjectId),
							eq(permissions.objectType, "workspace"),
							eq(permissions.objectId, workspaces.id),
							eq(
								permissions.action,
								WORKSPACE_PERMISSION_ACTIONS[0],
							),
							eq(permissions.value, "allow"),
						),
					),
			)
		:	sql`0`;

	const authWhere =
		ownerWhere ?
			or(eq(workspaces.status, "LISTED"), explicitAllowWhere, ownerWhere)
		:	or(eq(workspaces.status, "LISTED"), explicitAllowWhere);

	const finalWhere =
		query.where ? and(authWhere, query.where) : authWhere;

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
	auth_required: true,
	scopes: ["workspaces:read"],
};
