/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope, hasScope } from "../../../auth/helpers";
import { ADMIN_SCOPE } from "../../../auth/types";
import { getDB } from "../../../db";
import { collections, collectionItems } from "../../../db/schema";
import { expectOne, isUniqueConstraintError } from "../../../lib/db-helpers";
import { conflict, forbidden, notFound } from "../../../lib/errors";
import { parseBody, isResponse } from "../../../lib/validation";
import {
	AUTO_COLLECTION_ADMIN_MESSAGE,
	addCollectionItemSchema,
	isAutoCollection,
	isCollectionOwner,
} from "../../../services/collections";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();
const PATH = "/collections/:collectionId/items" as const;

route.post(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "collections:write");

	const parsed = await parseBody(c, addCollectionItemSchema);
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

	try {
		const rows = await db
			.insert(collectionItems)
			.values({ collectionId, ...parsed })
			.returning();
		return c.json(
			itemResponse(expectOne(rows, "Collection item insert")),
			201,
		);
	} catch (err) {
		if (isUniqueConstraintError(err)) {
			return conflict(c, "Item already in collection");
		}
		throw err;
	}
});

export default {
	route,
	method: "POST" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Add item to collection",
	auth_required: true,
	scopes: ["collections:write"],
	scopes_any: [ADMIN_SCOPE, "collections:write"],
};
