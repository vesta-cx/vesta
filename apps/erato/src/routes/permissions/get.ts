/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, hasScope } from "../../auth/helpers";
import { ADMIN_SCOPE } from "../../auth/types";
import { getDB } from "../../db";
import { collections, permissions } from "../../db/schema";
import { forbidden, notFound } from "../../lib/errors";
import { isCollectionOwner } from "../../services/collections";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/permissions/:id" as const;

route.get(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));

	const id = c.req.param("id");
	const db = getDB(c.env.DB);

	const [row] = await db
		.select()
		.from(permissions)
		.where(eq(permissions.id, id))
		.limit(1);
	if (!row) return notFound(c, "Permission");

	const isAdmin = hasScope(auth, ADMIN_SCOPE);
	const isSubject =
		row.subjectType === auth.subjectType &&
		row.subjectId === auth.subjectId;
	let canReadCollectionPermission = false;
	if (
		row.objectType === "collection" &&
		hasScope(auth, "collections:read") &&
		auth.subjectType === "user"
	) {
		const [collection] = await db
			.select()
			.from(collections)
			.where(eq(collections.id, row.objectId))
			.limit(1);
		canReadCollectionPermission =
			collection ?
				await isCollectionOwner(
					db,
					collection,
					auth.subjectId,
				)
			:	false;
	}

	if (!isAdmin && !isSubject && !canReadCollectionPermission) {
		return forbidden(c);
	}

	return c.json(itemResponse(row));
});

export default {
	route,
	method: "GET" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Get permission by id",
	auth_required: true,
	scopes: ["permissions:read"],
	scopes_any: ["permissions:read", "collections:read"],
};
