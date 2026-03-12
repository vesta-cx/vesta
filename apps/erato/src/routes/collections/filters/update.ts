/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { requireAuth, requireScope, hasScope } from "../../../auth/helpers";
import { getDB } from "../../../db";
import {
	COLLECTION_ITEM_TYPES,
	ENGAGEMENT_FILTER_ACTIONS,
	collections,
	collectionItemFilters,
} from "../../../db/schema";
import { forbidden, notFound } from "../../../lib/errors";
import { parseBody, isResponse, z } from "../../../lib/validation";
import { isCollectionOwner } from "../../../services/collections";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const filterItemSchema = z.object({
	itemType: z.enum(COLLECTION_ITEM_TYPES),
	itemId: z.string().nullable().optional(),
	engagementAction: z.enum(ENGAGEMENT_FILTER_ACTIONS),
	isVisible: z.boolean(),
});

const updateFiltersSchema = z.array(filterItemSchema);

const route = new Hono<AppEnv>();

route.put("/collections/:collectionId/filters", async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "collections:write");

	const parsed = await parseBody(c, updateFiltersSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDB(c.env.DB);
	const collectionId = c.req.param("collectionId");

	const [existing] = await db
		.select()
		.from(collections)
		.where(eq(collections.id, collectionId))
		.limit(1);
	if (!existing) return notFound(c, "Collection");

	const isAdmin = hasScope(auth, "admin");
	const isOwner = await isCollectionOwner(db, existing, auth.subjectId);
	if (!isAdmin && !isOwner) return forbidden(c);

	await db
		.delete(collectionItemFilters)
		.where(eq(collectionItemFilters.collectionId, collectionId));

	if (parsed.length > 0) {
		await db.insert(collectionItemFilters).values(
			parsed.map((item) => ({
				collectionId,
				itemType: item.itemType,
				itemId: item.itemId ?? null,
				engagementAction: item.engagementAction,
				isVisible: item.isVisible,
			})),
		);
	}

	const rows = await db
		.select()
		.from(collectionItemFilters)
		.where(eq(collectionItemFilters.collectionId, collectionId));

	return c.json({ data: rows });
});

export default {
	route,
	method: "PUT" as RouteMetadata["method"],
	path: "/collections/:collectionId/filters",
	description: "Update collection item filters",
	auth_required: true,
	scopes: ["collections:write"],
};
