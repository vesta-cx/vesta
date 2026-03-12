/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope, hasScope } from "../../auth/helpers";
import { getDB } from "../../db";
import { userSubscriptions } from "../../db/schema";
import { forbidden, notFound } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.get("/subscriptions/:userId", async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "subscriptions:read");

	const userId = c.req.param("userId");
	const isAdmin = hasScope(auth, "admin");
	if (!isAdmin && auth.subjectId !== userId) return forbidden(c);

	const db = getDB(c.env.DB);

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
