/** @format */

import { and, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import {
	parseListQuery,
	listResponse,
	type ListQueryConfig,
} from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope } from "../../../auth/helpers";
import { getDB } from "../../../db";
import { collections, collectionItemFilters } from "../../../db/schema";
import { forbidden, notFound } from "../../../lib/errors";
import { isCollectionOwner } from "../../../services/collections";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();

const collectionFilterListConfig: ListQueryConfig = {
	filters: {
		item_type: { column: collectionItemFilters.itemType },
		item_id: { column: collectionItemFilters.itemId },
		engagement_action: {
			column: collectionItemFilters.engagementAction,
		},
		is_visible: {
			column: collectionItemFilters.isVisible,
			parse: (value) => value === "true",
		},
	},
	sortable: {
		item_type: collectionItemFilters.itemType,
		engagement_action: collectionItemFilters.engagementAction,
	},
	defaultSort: { key: "item_type", dir: "asc" },
};

route.get("/collections/:collectionId/filters", async (c) => {
	const auth = c.get("auth");
	requireScope(auth, "collections:read");
	const apiAuth = requireAuth(auth);

	const db = getDB(c.env.DB);
	const collectionId = c.req.param("collectionId");
	const query = parseListQuery(
		new URL(c.req.url).searchParams,
		collectionFilterListConfig,
	);

	const [existing] = await db
		.select()
		.from(collections)
		.where(eq(collections.id, collectionId))
		.limit(1);
	if (!existing) return notFound(c, "Collection");

	const isAdmin = apiAuth.scopes.includes("admin");
	const isOwner = await isCollectionOwner(db, existing, apiAuth.subjectId);
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
			.select({ total: sql<number>`count(*)` })
			.from(collectionItemFilters)
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
	path: "/collections/:collectionId/filters",
	description: "List collection item filters",
	auth_required: true,
	scopes: ["collections:read"],
};
