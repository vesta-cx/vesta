import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { requireScope } from "../../../auth/helpers";
import { getDb } from "../../../db";
import { collections, collectionItems } from "../../../db/schema";
import { notFound } from "../../../lib/errors";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();

route.get("/collections/:collectionId/items", async (c) => {
	const auth = c.get("auth");
	requireScope(auth, "collections:read");

	const db = getDb(c.env.DB);
	const collectionId = c.req.param("collectionId");

	const [exists] = await db
		.select({ id: collections.id })
		.from(collections)
		.where(eq(collections.id, collectionId))
		.limit(1);
	if (!exists) return notFound(c, "Collection");

	const rows = await db
		.select()
		.from(collectionItems)
		.where(eq(collectionItems.collectionId, collectionId));

	return c.json({ data: rows });
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/collections/:collectionId/items",
	description: "List collection items",
	auth_required: true,
	scopes: ["collections:read"],
};
