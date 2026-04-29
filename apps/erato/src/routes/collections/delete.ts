/** @format */

import { Hono } from "hono";
import { requireAuth, requireScope } from "../../auth/helpers";
import { ADMIN_SCOPE } from "../../auth/types";
import { getDB } from "../../db";
import { collections } from "../../db/schema";
import { notFound } from "../../lib/errors";
import { collectionMutationWhere } from "../../services/collections";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/collections/:id" as const;

route.delete(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "collections:write");

	const db = getDB(c.env.DB);
	const [row] = await db
		.delete(collections)
		.where(collectionMutationWhere(db, auth, c.req.param("id")))
		.returning({ id: collections.id });
	if (!row) return notFound(c, "Collection");

	return c.body(null, 204);
});

export default {
	route,
	method: "DELETE" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Delete collection",
	auth_required: true,
	scopes: ["collections:write"],
	scopes_any: [ADMIN_SCOPE, "collections:write"],
};
