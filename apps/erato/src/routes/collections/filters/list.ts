/** @format */

import { and, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { parseListQuery, listResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope, hasScope } from "../../../auth/helpers";
import { ADMIN_SCOPE } from "../../../auth/types";
import { getDB } from "../../../db";
import { collections, collectionItemFilters } from "../../../db/schema";
import { forbidden, notFound } from "../../../lib/errors";
import {
	collectionFilterListConfig,
	isCollectionOwner,
} from "../../../services/collections";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();
const PATH = "/collections/:collectionId/filters" as const;
const countAll = sql<string | number>`count(*)`;

route.get(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "collections:read");

	const db = getDB(c.env.DB);
	const collectionId = c.req.param("collectionId");
	const query = parseListQuery(
		new URLSearchParams(c.req.query() as Record<string, string>),
		collectionFilterListConfig,
	);

	const [existing] = await db
		.select({
			id: collections.id,
			ownerType: collections.ownerType,
			ownerId: collections.ownerId,
		})
		.from(collections)
		.where(eq(collections.id, collectionId))
		.limit(1);
	if (!existing) return notFound(c, "Collection");

	const isAdmin = hasScope(auth, ADMIN_SCOPE);
	const isOwner =
		!isAdmin &&
		(await isCollectionOwner(db, existing, auth.subjectId));
	if (!isAdmin && !isOwner) return forbidden(c);

	const authWhere = eq(collectionItemFilters.collectionId, collectionId);
	const whereClause =
		query.where ? and(authWhere, query.where) : authWhere;
	const [rows, countResult] = await Promise.all([
		db
			.select()
			.from(collectionItemFilters)
			.where(whereClause)
			.orderBy(query.orderBy)
			.limit(query.limit)
			.offset(query.offset),
		db
			.select({ total: countAll })
			.from(collectionItemFilters)
			.where(whereClause),
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
	description: "List collection item filters",
	auth_required: true,
	scopes: ["collections:read"],
	scopes_any: [ADMIN_SCOPE, "collections:read"],
};
