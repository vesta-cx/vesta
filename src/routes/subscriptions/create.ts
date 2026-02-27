/** @format */

import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, hasScope } from "../../auth/helpers";
import { getDB } from "../../db";
import { userSubscriptions } from "../../db/schema";
import { conflict, forbidden } from "../../lib/errors";
import { parseBody, isResponse } from "../../lib/validation";
import { createSubscriptionSchema } from "../../services/subscriptions";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.post("/subscriptions", async (c) => {
	const auth = requireAuth(c.get("auth"));
	if (!hasScope(auth, "admin")) return forbidden(c);

	const parsed = await parseBody(c, createSubscriptionSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDB(c.env.DB);
	try {
		const [row] = await db
			.insert(userSubscriptions)
			.values(parsed as any)
			.returning();
		return c.json(itemResponse(row!), 201);
	} catch (err) {
		if (err instanceof Error && /UNIQUE/i.test(err.message)) {
			return conflict(c, "Subscription already exists");
		}
		throw err;
	}
});

export default {
	route,
	method: "POST" as RouteMetadata["method"],
	path: "/subscriptions",
	description: "Create subscription",
	auth_required: true,
	scopes: ["admin"],
};
