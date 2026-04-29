/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { runListQuery } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope } from "../../../auth/helpers";
import { ADMIN_SCOPE } from "../../../auth/types";
import { getDB } from "../../../db";
import { collectionItems } from "../../../db/schema";
import { notFound } from "../../../lib/errors";
import {
	canReadCollection,
	collectionItemListConfig,
} from "../../../services/collections";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();
const PATH = "/collections/:collectionId/items" as const;

route.get(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "collections:read");

	const db = getDB(c.env.DB);
	const collectionId = c.req.param("collectionId");
	if (!(await canReadCollection(db, auth, collectionId))) {
		return notFound(c, "Collection");
	}

	const envelope = await runListQuery({
		db,
		table: collectionItems,
		input: new URLSearchParams(
			c.req.query() as Record<string, string>,
		),
		config: collectionItemListConfig,
		baseWhere: eq(collectionItems.collectionId, collectionId),
		mode: "envelope",
	});
	return c.json(envelope);
});

export default {
	route,
	method: "GET" satisfies RouteMetadata["method"],
	path: PATH,
	description: "List collection items",
	auth_required: true,
	scopes: ["collections:read"],
	scopes_any: [ADMIN_SCOPE, "collections:read"],
};
