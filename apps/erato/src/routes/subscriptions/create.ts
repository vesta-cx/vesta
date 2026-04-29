/** @format */

import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope } from "../../auth/helpers";
import { ADMIN_SCOPE } from "../../auth/types";
import { getDB } from "../../db";
import { userSubscriptions } from "../../db/schema";
import { expectOne, isUniqueConstraintError } from "../../lib/db-helpers";
import { conflict } from "../../lib/errors";
import { parseBody, isResponse } from "../../lib/validation";
import { createSubscriptionSchema } from "../../services/subscriptions";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/subscriptions" as const;

route.post(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, ADMIN_SCOPE);

	const parsed = await parseBody(c, createSubscriptionSchema);
	if (isResponse(parsed)) return parsed;

	try {
		const rows = await getDB(c.env.DB)
			.insert(userSubscriptions)
			.values(parsed)
			.returning();
		return c.json(
			itemResponse(expectOne(rows, "Subscription insert")),
			201,
		);
	} catch (err) {
		if (isUniqueConstraintError(err)) {
			return conflict(c, "Subscription already exists");
		}
		throw err;
	}
});

export default {
	route,
	method: "POST" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Create a new user subscription (admin only)",
	auth_required: true,
	scopes: [ADMIN_SCOPE],
};
