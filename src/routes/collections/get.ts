/** @format */

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { hasScope, isAuthenticated } from "../../auth/helpers";
import { getDB } from "../../db";
import { collections } from "../../db/schema";
import { forbidden, notFound } from "../../lib/errors";
import { publicCollectionWhere } from "../../services/collections";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.get("/collections/:id", async (c) => {
	const auth = c.get("auth");
	const db = getDB(c.env.DB);
	const id = c.req.param("id");

	if (isAuthenticated(auth) && auth.scopes.includes("admin")) {
		const [row] = await db
			.select()
			.from(collections)
			.where(eq(collections.id, id))
			.limit(1);
		return row ?
				c.json(itemResponse(row))
			:	notFound(c, "Collection");
	}

	if (isAuthenticated(auth)) {
		if (!hasScope(auth, "collections:read")) return forbidden(c);
		const [row] = await db
			.select()
			.from(collections)
			.where(eq(collections.id, id))
			.limit(1);
		return row ?
				c.json(itemResponse(row))
			:	notFound(c, "Collection");
	}

	const [row] = await db
		.select()
		.from(collections)
		.where(and(eq(collections.id, id), publicCollectionWhere()))
		.limit(1);
	return row ? c.json(itemResponse(row)) : notFound(c, "Collection");
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/collections/:id",
	description: "Get collection by ID",
	auth_required: false,
	scopes: ["collections:read"],
};
