/** @format */

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { requireAuth, hasScope } from "../../auth/helpers";
import { getDB } from "../../db";
import { userFeatures } from "../../db/schema";
import { forbidden, notFound } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.delete("/users/:userId/features/:slug", async (c) => {
	const auth = requireAuth(c.get("auth"));
	if (!hasScope(auth, "admin")) return forbidden(c);

	const userId = c.req.param("userId");
	const slug = c.req.param("slug");
	const db = getDB(c.env.DB);

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
