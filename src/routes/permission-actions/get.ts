import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireScope } from "../../auth/helpers";
import { getDb } from "../../db";
import { permissionActions } from "../../db/schema";
import { notFound } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.get("/permission-actions/:slug", async (c) => {
	const auth = c.get("auth");
	requireScope(auth, "permissions:read");

	const slug = c.req.param("slug");
	const db = getDb(c.env.DB);

	const [row] = await db
		.select()
		.from(permissionActions)
		.where(eq(permissionActions.slug, slug))
		.limit(1);

	return row ? c.json(itemResponse(row)) : notFound(c, "Permission action");
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/permission-actions/:slug",
	description: "Get permission action by slug",
	auth_required: true,
	scopes: ["permissions:read"],
};
