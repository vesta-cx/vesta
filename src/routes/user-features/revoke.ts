import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { requireAuth } from "../../auth/helpers";
import { getDb } from "../../db";
import { userFeatures } from "../../db/schema";
import { forbidden, notFound } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.delete("/users/:userId/features/:slug", async (c) => {
	const auth = c.get("auth");
	const apiAuth = requireAuth(auth);
	if (!apiAuth.scopes.includes("admin")) return forbidden(c);

	const userId = c.req.param("userId");
	const slug = c.req.param("slug");
	const db = getDb(c.env.DB);

	const [existing] = await db
		.select()
		.from(userFeatures)
		.where(
			and(
				eq(userFeatures.userId, userId),
				eq(userFeatures.featureSlug, slug),
			),
		)
		.limit(1);
	if (!existing) return notFound(c, "User feature");

	const [row] = await db
		.delete(userFeatures)
		.where(
			and(
				eq(userFeatures.userId, userId),
				eq(userFeatures.featureSlug, slug),
			),
		)
		.returning();
	if (!row) return notFound(c, "User feature");

	return c.body(null, 204);
});

export default {
	route,
	method: "DELETE" as RouteMetadata["method"],
	path: "/users/:userId/features/:slug",
	description: "Revoke feature from user",
	auth_required: true,
	scopes: ["admin"],
};
