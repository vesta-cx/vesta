/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, hasScope } from "../../auth/helpers";
import { getDB } from "../../db";
import { userSubscriptions } from "../../db/schema";
import { conflict, forbidden, notFound } from "../../lib/errors";
import { parseBody, isResponse } from "../../lib/validation";
import { updateSubscriptionSchema } from "../../services/subscriptions";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.put("/subscriptions/:userId", async (c) => {
	const auth = requireAuth(c.get("auth"));
	if (!hasScope(auth, "admin")) return forbidden(c);

	const userId = c.req.param("userId");
	const parsed = await parseBody(c, updateSubscriptionSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDB(c.env.DB);
	const [existing] = await db
		.select()
		.from(userSubscriptions)
		.where(eq(userSubscriptions.userId, userId))
		.limit(1);
	if (!existing) return notFound(c, "Subscription");

	try {
		const [row] = await db
			.update(userSubscriptions)
			.set({ ...parsed, updatedAt: new Date() })
			.where(eq(userSubscriptions.userId, userId))
			.returning();
		return row ?
				c.json(itemResponse(row))
			:	notFound(c, "Subscription");
	} catch (err) {
		if (err instanceof Error && /UNIQUE/i.test(err.message)) {
			return conflict(c, "Conflict on update");
		}
		throw err;
	}
});

export default {
	route,
	method: "PUT" as RouteMetadata["method"],
	path: "/subscriptions/:userId",
	description: "Update subscription",
	auth_required: true,
	scopes: ["admin"],
};
