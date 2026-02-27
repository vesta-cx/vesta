/** @format */

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { requireAuth, requireScope, hasScope } from "../../../auth/helpers";
import { getDB } from "../../../db";
import { collections, collectionItems } from "../../../db/schema";
import { forbidden, notFound } from "../../../lib/errors";
import { isCollectionOwner } from "../../../services/collections";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();

route.delete(
	"/collections/:collectionId/items/:itemType/:itemId",
	async (c) => {
		const auth = requireAuth(c.get("auth"));
		requireScope(auth, "collections:write");

		const db = getDB(c.env.DB);
		const collectionId = c.req.param("collectionId");
		const itemType = c.req.param("itemType");
		const itemId = c.req.param("itemId");

		const [existing] = await db
			.select()
			.from(collections)
			.where(eq(collections.id, collectionId))
			.limit(1);
		if (!existing) return notFound(c, "Collection");

		const isAdmin = hasScope(auth, "admin");
		const isOwner = await isCollectionOwner(
			db,
			existing,
			auth.subjectId,
		);
		if (!isAdmin && !isOwner) return forbidden(c);

		const [row] = await db
			.delete(collectionItems)
			.where(
				and(
					eq(
						collectionItems.collectionId,
						collectionId,
					),
					eq(
						collectionItems.itemType,
						itemType as (typeof collectionItems.$inferSelect)["itemType"],
					),
					eq(collectionItems.itemId, itemId),
				),
			)
			.returning();
		if (!row) return notFound(c, "Collection item");

		return c.body(null, 204);
	},
);

export default {
	route,
	method: "DELETE" as RouteMetadata["method"],
	path: "/collections/:collectionId/items/:itemType/:itemId",
	description: "Remove item from collection",
	auth_required: true,
	scopes: ["collections:write"],
};
