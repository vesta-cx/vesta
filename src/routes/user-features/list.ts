import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { requireAuth, requireScope } from "../../auth/helpers";
import { getDb } from "../../db";
import { userFeatures } from "../../db/schema";
import { forbidden } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.get("/users/:userId/features", async (c) => {
	const auth = c.get("auth");
	const apiAuth = requireAuth(auth);
	requireScope(auth, "users:read");

	const userId = c.req.param("userId");
	const isAdmin = apiAuth.scopes.includes("admin");
	if (!isAdmin && apiAuth.userId !== userId) return forbidden(c);

	const db = getDb(c.env.DB);

	const rows = await db
		.select()
		.from(userFeatures)
		.where(eq(userFeatures.userId, userId));

	return c.json({ data: rows });
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/users/:userId/features",
	description: "List user features",
	auth_required: true,
	scopes: ["users:read"],
};
