import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope } from "../../../auth/helpers";
import { getDb } from "../../../db";
import {
	COLLECTION_ITEM_TYPES,
	collections,
	collectionItems,
} from "../../../db/schema";
import { conflict, forbidden, notFound } from "../../../lib/errors";
import { parseBody, isResponse, z } from "../../../lib/validation";
import { isCollectionOwner } from "../../../services/collections";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const addItemSchema = z.object({
	itemType: z.enum(COLLECTION_ITEM_TYPES),
	itemId: z.string().min(1),
	position: z.number().int().optional(),
});

const route = new Hono<AppEnv>();

route.post("/collections/:collectionId/items", async (c) => {
	const auth = c.get("auth");
	requireScope(auth, "collections:write");
	const apiAuth = requireAuth(auth);

	const parsed = await parseBody(c, addItemSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDb(c.env.DB);
	const collectionId = c.req.param("collectionId");

	const [existing] = await db
		.select()
		.from(collections)
		.where(eq(collections.id, collectionId))
		.limit(1);
	if (!existing) return notFound(c, "Collection");

	const isAdmin = apiAuth.scopes.includes("admin");
	const isOwner = await isCollectionOwner(db, existing, apiAuth.userId);
	if (!isAdmin && !isOwner) return forbidden(c);

	try {
		const [row] = await db
			.insert(collectionItems)
			.values({ collectionId, ...parsed })
			.returning();
		return c.json(itemResponse(row!), 201);
	} catch (err) {
		if (err instanceof Error && /UNIQUE/i.test(err.message)) {
			return conflict(c, "Item already in collection");
		}
		throw err;
	}
});

export default {
	route,
	method: "POST" as RouteMetadata["method"],
	path: "/collections/:collectionId/items",
	description: "Add item to collection",
	auth_required: true,
	scopes: ["collections:write"],
};
