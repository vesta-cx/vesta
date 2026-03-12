/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope, hasScope } from "../../auth/helpers";
import { getDB } from "../../db";
import { permissions } from "../../db/schema";
import { forbidden, notFound } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.get("/permissions/:id", async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "permissions:read");

	const id = c.req.param("id");
	const db = getDB(c.env.DB);

	const [row] = await db
		.select()
		.from(permissions)
		.where(eq(permissions.id, id))
		.limit(1);
	if (!row) return notFound(c, "Permission");

	const isAdmin = hasScope(auth, "admin");
	const isSubject =
		row.subjectType === auth.subjectType &&
		row.subjectId === auth.subjectId;
	const canReadCollectionPermission =
		row.objectType === "collection" &&
		hasScope(auth, "collections:read");
	if (!isAdmin && !isSubject && !canReadCollectionPermission) {
		return forbidden(c);
	}

	return c.json(itemResponse(row));
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/permissions/:id",
	description: "Get permission by id",
	auth_required: true,
	scopes: ["permissions:read"],
};
