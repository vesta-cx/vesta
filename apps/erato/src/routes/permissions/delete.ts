/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { requireAuth, requireScope, hasScope } from "../../auth/helpers";
import { getDB } from "../../db";
import { permissions } from "../../db/schema";
import { forbidden, notFound } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.delete("/permissions/:id", async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "permissions:write");

	const id = c.req.param("id");
	const db = getDB(c.env.DB);

	const [existing] = await db
		.select()
		.from(permissions)
		.where(eq(permissions.id, id))
		.limit(1);
	if (!existing) return notFound(c, "Permission");

	const isAdmin = hasScope(auth, "admin");
	const isSubject =
		existing.subjectType === auth.subjectType &&
		existing.subjectId === auth.subjectId;
	const canManageCollectionPermission =
		existing.objectType === "collection" &&
		hasScope(auth, "collections:write");
	if (!isAdmin && !isSubject && !canManageCollectionPermission) {
		return forbidden(c);
	}

	const [row] = await db
		.delete(permissions)
		.where(eq(permissions.id, id))
		.returning();
	if (!row) return notFound(c, "Permission");

	return c.body(null, 204);
});

export default {
	route,
	method: "DELETE" as RouteMetadata["method"],
	path: "/permissions/:id",
	description: "Delete permission",
	auth_required: true,
	scopes: ["permissions:write"],
};
