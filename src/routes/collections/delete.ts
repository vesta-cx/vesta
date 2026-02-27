/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { requireAuth, requireScope, hasScope } from "../../auth/helpers";
import { getDB } from "../../db";
import { collections } from "../../db/schema";
import { forbidden, notFound } from "../../lib/errors";
import { isCollectionOwner } from "../../services/collections";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.delete("/collections/:id", async (c) => {
	const auth = requireAuth(c.get("auth"));

	requireScope(auth, "collections:write");

	const id = c.req.param("id");
	const db = getDB(c.env.DB);

	const [existing] = await db
		.select()
		.from(collections)
		.where(eq(collections.id, id))
		.limit(1);
	if (!existing) return notFound(c, "Collection");

	const isAdmin = hasScope(auth, "admin");
	const isOwner = await isCollectionOwner(db, existing, auth.subjectId);
	if (!isAdmin && !isOwner) return forbidden(c);

	const [row] = await db
		.delete(collections)
		.where(eq(collections.id, id))
		.returning();
	if (!row) return notFound(c, "Collection");

	return c.body(null, 204);
});

export default {
	route,
	method: "DELETE" as RouteMetadata["method"],
	path: "/collections/:id",
	description: "Delete collection",
	auth_required: true,
	scopes: ["collections:write"],
};
