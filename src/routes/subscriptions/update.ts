import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth } from "../../auth/helpers";
import { getDb } from "../../db";
import { userSubscriptions } from "../../db/schema";
import { conflict, forbidden, notFound } from "../../lib/errors";
import { parseBody, isResponse } from "../../lib/validation";
import { updateSubscriptionSchema } from "../../services/subscriptions";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.put("/subscriptions/:userId", async (c) => {
	const auth = c.get("auth");
	const apiAuth = requireAuth(auth);
	if (!apiAuth.scopes.includes("admin")) return forbidden(c);

	const userId = c.req.param("userId");
	const parsed = await parseBody(c, updateSubscriptionSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDb(c.env.DB);
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
		return row ? c.json(itemResponse(row)) : notFound(c, "Subscription");
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
