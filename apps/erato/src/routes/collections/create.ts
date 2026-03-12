/** @format */

import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth, requireScope } from "../../auth/helpers";
import { getDB } from "../../db";
import { collections } from "../../db/schema";
import { conflict, forbidden } from "../../lib/errors";
import { parseBody, isResponse } from "../../lib/validation";
import {
	createCollectionSchema,
	isAutoCollection,
} from "../../services/collections";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.post("/collections", async (c) => {
	const auth = requireAuth(c.get("auth"));

	requireScope(auth, "collections:write");

	const parsed = await parseBody(c, createCollectionSchema);
	if (isResponse(parsed)) return parsed;

	const isAdmin = hasScope(auth, "admin");
	if (!isAdmin && isAutoCollection({ type: parsed.type ?? "manual" })) {
		return forbidden(
			c,
			"Auto collections are server-managed. Admin scope is required.",
		);
	}

	const db = getDB(c.env.DB);
	try {
		const [row] = await db
			.insert(collections)
			.values(parsed as any)
			.returning();
		return c.json(itemResponse(row!), 201);
	} catch (err) {
		if (err instanceof Error && /UNIQUE/i.test(err.message)) {
			return conflict(c, "Collection already exists");
		}
		throw err;
	}
});

export default {
	route,
	method: "POST" as RouteMetadata["method"],
	path: "/collections",
	description: "Create collection",
	auth_required: true,
	scopes: ["collections:write"],
};
