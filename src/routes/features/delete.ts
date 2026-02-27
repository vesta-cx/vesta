import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { requireAuth } from "../../auth/helpers";
import { getDb } from "../../db";
import { features } from "../../db/schema";
import { forbidden, notFound } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.delete("/features/:slug", async (c) => {
	const auth = c.get("auth");
	const apiAuth = requireAuth(auth);
	if (!apiAuth.scopes.includes("admin")) return forbidden(c);

	const slug = c.req.param("slug");
	const db = getDb(c.env.DB);

	const [existing] = await db
		.select()
		.from(features)
		.where(eq(features.slug, slug))
		.limit(1);
	if (!existing) return notFound(c, "Feature");

	const [row] = await db
		.delete(features)
		.where(eq(features.slug, slug))
		.returning();
	if (!row) return notFound(c, "Feature");

	return c.body(null, 204);
});

export default {
	route,
	method: "DELETE" as RouteMetadata["method"],
	path: "/features/:slug",
	description: "Delete feature",
	auth_required: true,
	scopes: ["admin"],
};
