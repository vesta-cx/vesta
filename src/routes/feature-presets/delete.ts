/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { requireAuth } from "../../auth/helpers";
import { getDB } from "../../db";
import { featurePresets } from "../../db/schema";
import { forbidden, notFound } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.delete("/feature-presets/:name", async (c) => {
	const auth = c.get("auth");
	const apiAuth = requireAuth(auth);
	if (!apiAuth.scopes.includes("admin")) return forbidden(c);

	const name = c.req.param("name");
	const db = getDB(c.env.DB);

	const [existing] = await db
		.select()
		.from(featurePresets)
		.where(eq(featurePresets.name, name))
		.limit(1);
	if (!existing) return notFound(c, "Feature preset");

	const [row] = await db
		.delete(featurePresets)
		.where(eq(featurePresets.name, name))
		.returning();
	if (!row) return notFound(c, "Feature preset");

	return c.body(null, 204);
});

export default {
	route,
	method: "DELETE" as RouteMetadata["method"],
	path: "/feature-presets/:name",
	description: "Delete feature preset",
	auth_required: true,
	scopes: ["admin"],
};
