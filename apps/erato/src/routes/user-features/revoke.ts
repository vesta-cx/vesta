/** @format */

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { requireAuth, requireScope } from "../../auth/helpers";
import { ADMIN_SCOPE } from "../../auth/types";
import { getDB } from "../../db";
import { userFeatures } from "../../db/schema";
import { notFound } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/users/:userId/features/:slug" as const;

route.delete(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, ADMIN_SCOPE);

	const { userId, slug } = c.req.param();
	const [row] = await getDB(c.env.DB)
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
	method: "DELETE" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Revoke feature from user",
	auth_required: true,
	scopes: [ADMIN_SCOPE],
};
