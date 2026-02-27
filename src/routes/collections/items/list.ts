/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import {
	runListQuery,
	type ListQueryConfig,
} from "@mia-cx/drizzle-query-factory";
import { requireScope } from "../../../auth/helpers";
import { getDB } from "../../../db";
import { collections, collectionItems } from "../../../db/schema";
import { notFound } from "../../../lib/errors";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();

const collectionItemListConfig: ListQueryConfig = {
	filters: {
		item_type: { column: collectionItems.itemType },
		item_id: { column: collectionItems.itemId },
		position: {
			column: collectionItems.position,
			parse: (value) => Number(value),
		},
	},
	sortable: {
		position: collectionItems.position,
		item_id: collectionItems.itemId,
	},
	defaultSort: { key: "position", dir: "asc" },
};

route.get("/collections/:collectionId/items", async (c) => {
	const auth = c.get("auth");
	requireScope(auth, "collections:read");

	const db = getDB(c.env.DB);
	const collectionId = c.req.param("collectionId");

	const [exists] = await db
		.select({ id: collections.id })
		.from(collections)
		.where(eq(collections.id, collectionId))
		.limit(1);
	if (!exists) return notFound(c, "Collection");

	const envelope = await runListQuery({
		db,
		table: collectionItems,
		input: new URL(c.req.url).searchParams,
		config: collectionItemListConfig,
		baseWhere: eq(collectionItems.collectionId, collectionId),
		mode: "envelope",
	});
	return c.json(envelope);
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/collections/:collectionId/items",
	description: "List collection items",
	auth_required: true,
	scopes: ["collections:read"],
};
