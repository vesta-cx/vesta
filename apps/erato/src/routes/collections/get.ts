/** @format */

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth } from "../../auth/helpers";
import { ADMIN_SCOPE } from "../../auth/types";
import { getDB } from "../../db";
import { collections } from "../../db/schema";
import { forbidden, notFound } from "../../lib/errors";
import { collectionAccessWhere } from "../../services/collections";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/collections/:id" as const;

route.get(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	const db = getDB(c.env.DB);
	const id = c.req.param("id");

	if (!hasScope(auth, "collections:read")) return forbidden(c);

	const accessWhere =
		hasScope(auth, ADMIN_SCOPE) ?
			eq(collections.id, id)
		:	and(
				eq(collections.id, id),
				collectionAccessWhere(db, auth, id),
			);

	const [row] = await db
		.select()
		.from(collections)
		.where(accessWhere)
		.limit(1);
	return row ? c.json(itemResponse(row)) : notFound(c, "Collection");
});

export default {
	route,
	method: "GET" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Get collection by ID",
	auth_required: true,
	scopes: ["collections:read"],
	scopes_any: [ADMIN_SCOPE, "collections:read"],
};
