import { and, eq, inArray, or } from "drizzle-orm";
import { Hono } from "hono";
import {
	parseListQuery,
	listResponse,
	type ListQueryConfig,
} from "@mia-cx/drizzle-query-factory";
import { hasScope, isAuthenticated } from "../../auth/helpers";
import { getDb } from "../../db";
import { permissions, resources } from "../../db/schema";
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
	const auth = c.get("auth");
	const db = getDb(c.env.DB);
	const query = parseListQuery(new URL(c.req.url).searchParams, queryConfig);

	if (isAuthenticated(auth) && auth.scopes.includes("admin")) {
		const { rows, total } = await paginatedQuery(db, query);
		return c.json(listResponse(rows, total, query.limit, query.offset));
	}

	if (isAuthenticated(auth)) {
		if (!hasScope(auth, "resources:read")) {
			return forbidden(c);
		}

		const authWhere = or(
			eq(resources.status, "LISTED"),
			inArray(
				resources.id,
				db
					.select({ id: permissions.objectId })
					.from(permissions)
					.where(
						and(
							eq(permissions.subjectId, auth.userId),
							eq(permissions.objectType, "resource"),
							eq(permissions.value, "allow"),
						),
					),
			),
		);

		const { rows, total } = await paginatedQuery(db, query, authWhere);
		return c.json(listResponse(rows, total, query.limit, query.offset));
	}

	const authWhere = eq(resources.status, "LISTED");
	const { rows, total } = await paginatedQuery(db, query, authWhere);
	return c.json(listResponse(rows, total, query.limit, query.offset));
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/resources",
	description: "List resources",
	auth_required: false,
	scopes: ["resources:read"],
};

// --- helpers ---

import { sql, type SQL } from "drizzle-orm";

const paginatedQuery = async (
	db: ReturnType<typeof getDb>,
	query: ReturnType<typeof parseListQuery>,
	authWhere?: SQL,
) => {
	const finalWhere = authWhere
		? query.where
			? and(authWhere, query.where)
			: authWhere
		: query.where;

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
