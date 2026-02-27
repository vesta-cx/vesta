import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope } from "../../auth/helpers";
import { getDb } from "../../db";
import { userSubscriptions } from "../../db/schema";
import { forbidden, notFound } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.get("/subscriptions/:userId", async (c) => {
	const auth = c.get("auth");
	const apiAuth = requireAuth(auth);
	requireScope(auth, "subscriptions:read");

	const userId = c.req.param("userId");
	const isAdmin = apiAuth.scopes.includes("admin");
	if (!isAdmin && apiAuth.userId !== userId) return forbidden(c);

	const db = getDb(c.env.DB);

	const [row] = await db
		.select()
		.from(userSubscriptions)
		.where(eq(userSubscriptions.userId, userId))
		.limit(1);
	return row ? c.json(itemResponse(row)) : notFound(c, "Subscription");
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/subscriptions/:userId",
	description: "Get subscription by user ID",
	auth_required: true,
	scopes: ["subscriptions:read"],
};
