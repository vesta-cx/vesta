/** @format */

import { and, eq, exists, or } from "drizzle-orm";
import { Hono } from "hono";
import {
	parseListQuery,
	listResponse,
	type ListQueryConfig,
} from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth } from "../../auth/helpers";
import { getDB } from "../../db";
import {
	RESOURCE_PERMISSION_ACTIONS,
	permissions,
	resources,
} from "../../db/schema";
import { forbidden } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const queryConfig: ListQueryConfig = {
	filters: {
		status: { column: resources.status },
		type: { column: resources.type },
		owner_id: { column: resources.ownerId },
		owner_type: { column: resources.ownerType },
		title: { column: resources.title, op: "like" },
	},
	sortable: {
		created_at: resources.createdAt,
		updated_at: resources.updatedAt,
		title: resources.title,
	},
	defaultSort: { key: "created_at", dir: "desc" },
};

const route = new Hono<AppEnv>();

route.get("/resources", async (c) => {
	const auth = requireAuth(c.get("auth"));
	const db = getDB(c.env.DB);
	const query = parseListQuery(
		new URL(c.req.url).searchParams,
		queryConfig,
	);

	if (hasScope(auth, "admin")) {
		const { rows, total } = await paginatedQuery(db, query);
		return c.json(
			listResponse(rows, total, query.limit, query.offset),
		);
	}

	if (!hasScope(auth, "resources:read")) {
		return forbidden(c);
	}

	const ownerWhere =
		auth.subjectType === "user" || auth.subjectType === "organization" ?
			and(
				eq(resources.ownerType, auth.subjectType),
				eq(resources.ownerId, auth.subjectId),
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
							eq(permissions.objectType, "resource"),
							eq(permissions.objectId, resources.id),
							eq(
								permissions.action,
								RESOURCE_PERMISSION_ACTIONS[0],
							),
							eq(permissions.value, "allow"),
						),
					),
			)
		:	sql`0`;

	const authWhere =
		ownerWhere ?
			or(
				eq(resources.status, "LISTED"),
				explicitAllowWhere,
				ownerWhere,
			)
		:	or(eq(resources.status, "LISTED"), explicitAllowWhere);

	const { rows, total } = await paginatedQuery(db, query, authWhere);
	return c.json(
		listResponse(rows, total, query.limit, query.offset),
	);
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/resources",
	description: "List resources",
	auth_required: true,
	scopes: ["resources:read"],
};

// --- helpers ---

import { sql, type SQL } from "drizzle-orm";

const paginatedQuery = async (
	db: ReturnType<typeof getDB>,
	query: ReturnType<typeof parseListQuery>,
	authWhere?: SQL,
) => {
	const finalWhere =
		authWhere ?
			query.where ?
				and(authWhere, query.where)
			:	authWhere
		:	query.where;

	const [rows, countResult] = await Promise.all([
		db
			.select()
			.from(resources)
			.where(finalWhere)
			.orderBy(query.orderBy)
			.limit(query.limit)
			.offset(query.offset),
		db
			.select({ total: sql<number>`count(*)` })
			.from(resources)
			.where(finalWhere),
	]);

	return { rows, total: countResult[0]?.total ?? 0 };
};
