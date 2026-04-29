/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { listResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope, hasScope } from "../../../auth/helpers";
import { ADMIN_SCOPE } from "../../../auth/types";
import { getDB } from "../../../db";
import { collections, collectionItemFilters } from "../../../db/schema";
import { forbidden, notFound } from "../../../lib/errors";
import { parseBody, isResponse } from "../../../lib/validation";
import {
	AUTO_COLLECTION_ADMIN_MESSAGE,
	isAutoCollection,
	isCollectionOwner,
	updateCollectionFiltersSchema,
} from "../../../services/collections";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();
const PATH = "/collections/:collectionId/filters" as const;

route.put(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "collections:write");

	const parsed = await parseBody(c, updateCollectionFiltersSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDB(c.env.DB);
	const collectionId = c.req.param("collectionId");

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

	const rows = parsed.map((item) => ({
		collectionId,
		itemType: item.itemType,
		itemId: item.itemId ?? null,
		engagementAction: item.engagementAction,
		isVisible: item.isVisible,
	}));

	await db.transaction(async (tx) => {
		await tx
			.delete(collectionItemFilters)
			.where(
				eq(
					collectionItemFilters.collectionId,
					collectionId,
				),
			);

		if (rows.length > 0) {
			await tx.insert(collectionItemFilters).values(rows);
		}
	});

	return c.json(listResponse(rows, rows.length, rows.length, 0));
});

export default {
	route,
	method: "PUT" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Update collection item filters",
	auth_required: true,
	scopes: ["collections:write"],
	scopes_any: [ADMIN_SCOPE, "collections:write"],
};
