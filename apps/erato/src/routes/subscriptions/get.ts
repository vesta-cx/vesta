/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope, hasScope } from "../../auth/helpers";
import { ADMIN_SCOPE } from "../../auth/types";
import { getDB } from "../../db";
import { userSubscriptions } from "../../db/schema";
import { forbidden, notFound } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/subscriptions/:userId" as const;

route.get(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "subscriptions:read");

	const userId = c.req.param("userId");
	if (!hasScope(auth, ADMIN_SCOPE) && auth.subjectId !== userId)
		return forbidden(c);

	const [row] = await getDB(c.env.DB)
		.select({
			userId: userSubscriptions.userId,
			stripeCustomerId: userSubscriptions.stripeCustomerId,
			stripeSubscriptionId:
				userSubscriptions.stripeSubscriptionId,
			activeFeatures: userSubscriptions.activeFeatures,
			customPriceCents: userSubscriptions.customPriceCents,
			discountPct: userSubscriptions.discountPct,
			discountType: userSubscriptions.discountType,
			billingCycleStart: userSubscriptions.billingCycleStart,
			billingCycleEnd: userSubscriptions.billingCycleEnd,
			isActive: userSubscriptions.isActive,
			createdAt: userSubscriptions.createdAt,
			updatedAt: userSubscriptions.updatedAt,
		})
		.from(userSubscriptions)
		.where(eq(userSubscriptions.userId, userId))
		.limit(1);
	return row ? c.json(itemResponse(row)) : notFound(c, "Subscription");
});

export default {
	route,
	method: "GET" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Get subscription by user ID",
	auth_required: true,
	scopes: ["subscriptions:read"],
	scopes_any: [ADMIN_SCOPE, "subscriptions:read"],
};
