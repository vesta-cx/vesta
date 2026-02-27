/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope } from "../../auth/helpers";
import { getDB } from "../../db";
import { collections } from "../../db/schema";
import { conflict, forbidden, notFound } from "../../lib/errors";
import { parseBody, isResponse } from "../../lib/validation";
import {
	isCollectionOwner,
	updateCollectionSchema,
} from "../../services/collections";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.put("/collections/:id", async (c) => {
	const auth = c.get("auth");
	requireScope(auth, "collections:write");
	const apiAuth = requireAuth(auth);

	const id = c.req.param("id");
	const parsed = await parseBody(c, updateCollectionSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDB(c.env.DB);
	const [existing] = await db
		.select()
		.from(collections)
		.where(eq(collections.id, id))
		.limit(1);
	if (!existing) return notFound(c, "Collection");

	const isAdmin = apiAuth.scopes.includes("admin");
	const isOwner = await isCollectionOwner(
		db,
		existing,
		apiAuth.subjectId,
	);
	if (!isAdmin && !isOwner) return forbidden(c);

	try {
		const [row] = await db
			.update(collections)
			.set({ ...parsed, updatedAt: new Date() })
			.where(eq(collections.id, id))
			.returning();
		return row ?
				c.json(itemResponse(row))
			:	notFound(c, "Collection");
	} catch (err) {
		if (err instanceof Error && /UNIQUE/i.test(err.message)) {
			return conflict(c, "Conflict on update");
		}
		throw err;
	}
});

export default {
	route,
	method: "PUT" as RouteMetadata["method"],
	path: "/collections/:id",
	description: "Update collection",
	auth_required: true,
	scopes: ["collections:write"],
};
