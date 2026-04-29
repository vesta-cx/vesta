/** @format */

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { requireAuth, requireScope, hasScope } from "../../../auth/helpers";
import { ADMIN_SCOPE } from "../../../auth/types";
import { getDB } from "../../../db";
import {
	collections,
	collectionItems,
	COLLECTION_ITEM_TYPES,
} from "../../../db/schema";
import { forbidden, notFound, singleError } from "../../../lib/errors";
import {
	AUTO_COLLECTION_ADMIN_MESSAGE,
	collectionItemTypeSchema,
	isAutoCollection,
	isCollectionOwner,
} from "../../../services/collections";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();
const PATH = "/collections/:collectionId/items/:itemType/:itemId" as const;

route.delete(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "collections:write");

	const db = getDB(c.env.DB);
	const collectionId = c.req.param("collectionId");
	const itemType = collectionItemTypeSchema.safeParse(
		c.req.param("itemType"),
	);
	const itemId = c.req.param("itemId");
	if (!itemType.success) {
		return singleError(
			c,
			422,
			`itemType must be one of: ${COLLECTION_ITEM_TYPES.join(", ")}`,
			"VALIDATION_ERROR",
			"itemType",
		);
	}

	const [existing] = await db
		.select()
		.from(collections)
		.where(eq(collections.id, collectionId))
		.limit(1);
	if (!existing) return notFound(c, "Collection");

	const isAdmin = hasScope(auth, ADMIN_SCOPE);
	if (!isAdmin && isAutoCollection(existing)) {
		return forbidden(c, AUTO_COLLECTION_ADMIN_MESSAGE);
	}
	const isOwner =
		!isAdmin &&
		(await isCollectionOwner(db, existing, auth.subjectId));
	if (!isAdmin && !isOwner) return forbidden(c);

	const [row] = await db
		.delete(collectionItems)
		.where(
			and(
				eq(collectionItems.collectionId, collectionId),
				eq(collectionItems.itemType, itemType.data),
				eq(collectionItems.itemId, itemId),
			),
		)
		.returning();
	if (!row) return notFound(c, "Collection item");

	return c.body(null, 204);
});

export default {
	route,
	method: "DELETE" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Remove item from collection",
	auth_required: true,
	scopes: ["collections:write"],
	scopes_any: [ADMIN_SCOPE, "collections:write"],
};
