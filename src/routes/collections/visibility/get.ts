/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { requireAuth, requireScope } from "../../../auth/helpers";
import { getDB } from "../../../db";
import { collections, collectionVisibilitySettings } from "../../../db/schema";
import { forbidden, notFound } from "../../../lib/errors";
import { isCollectionOwner } from "../../../services/collections";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();

route.get("/collections/:collectionId/visibility", async (c) => {
	const auth = c.get("auth");
	requireScope(auth, "collections:read");
	const apiAuth = requireAuth(auth);

	const db = getDB(c.env.DB);
	const collectionId = c.req.param("collectionId");

	const [existing] = await db
		.select()
		.from(collections)
		.where(eq(collections.id, collectionId))
		.limit(1);
	if (!existing) return notFound(c, "Collection");

	const isAdmin = apiAuth.scopes.includes("admin");
	const isOwner = await isCollectionOwner(db, existing, apiAuth.subjectId);
	if (!isAdmin && !isOwner) return forbidden(c);

	const rows = await db
		.select()
		.from(collectionVisibilitySettings)
		.where(
			eq(
				collectionVisibilitySettings.collectionId,
				collectionId,
			),
		);

	return c.json({ data: rows });
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/collections/:collectionId/visibility",
	description: "Get collection visibility settings",
	auth_required: true,
	scopes: ["collections:read"],
};
