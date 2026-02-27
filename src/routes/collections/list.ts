/** @format */

import type { SQL } from "drizzle-orm";
import { and, eq, exists, or, sql } from "drizzle-orm";
import { Hono } from "hono";
import { parseListQuery, listResponse } from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth } from "../../auth/helpers";
import { getDB } from "../../db";
import {
	COLLECTION_PERMISSION_ACTIONS,
	collections,
	permissions,
} from "../../db/schema";
import { forbidden } from "../../lib/errors";
import { collectionListConfig } from "../../services/collections";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.get("/collections", async (c) => {
	const auth = requireAuth(c.get("auth"));
	const db = getDB(c.env.DB);
	const query = parseListQuery(
		new URL(c.req.url).searchParams,
		collectionListConfig,
	);

	if (
		!hasScope(auth, "collections:read") &&
		!hasScope(auth, "admin")
	) {
		return forbidden(c);
	}

	let authWhere: SQL | undefined;

	if (!hasScope(auth, "admin")) {
		const ownerWhere =
			auth.subjectType === "user" || auth.subjectType === "workspace" ?
				and(
					eq(collections.ownerType, auth.subjectType),
					eq(collections.ownerId, auth.subjectId),
				)
			:	undefined;

		const permissionSubjectType =
			auth.subjectType === "user" ||
			auth.subjectType === "organization" ?
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
								eq(
									permissions.subjectId,
									auth.subjectId,
								),
								eq(
									permissions.objectType,
									"collection",
								),
								eq(
									permissions.objectId,
									collections.id,
								),
								eq(
									permissions.action,
									COLLECTION_PERMISSION_ACTIONS[0],
								),
								eq(permissions.value, "allow"),
							),
						),
				)
			:	sql`0`;

		authWhere =
			ownerWhere ?
				or(
					eq(collections.status, "LISTED"),
					explicitAllowWhere,
					ownerWhere,
				)
			:	or(eq(collections.status, "LISTED"), explicitAllowWhere);
	}

	const finalWhere =
		authWhere ?
			query.where ?
				and(authWhere, query.where)
			:	authWhere
		:	query.where;

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
		listResponse(
			rows,
			countResult[0]?.total ?? 0,
			query.limit,
			query.offset,
		),
	);
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/collections",
	description: "List collections",
	auth_required: true,
	scopes: ["collections:read"],
};
