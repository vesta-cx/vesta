/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope } from "../../auth/helpers";
import { getDB } from "../../db";
import { permissionActions } from "../../db/schema";
import { notFound } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/permission-actions/:slug" as const;

route.get(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "permissions:read");

	const slug = c.req.param("slug");
	const db = getDB(c.env.DB);

	const [row] = await db
		.select()
		.from(permissionActions)
		.where(eq(permissionActions.slug, slug))
		.limit(1);

	return row ?
			c.json(itemResponse(row))
		:	notFound(c, "Permission action");
});

export default {
	route,
	method: "GET" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Get permission action by slug",
	auth_required: true,
	scopes: ["permissions:read"],
};
