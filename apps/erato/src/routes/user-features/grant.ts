/** @format */

import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope } from "../../auth/helpers";
import { ADMIN_SCOPE } from "../../auth/types";
import { getDB } from "../../db";
import { userFeatures } from "../../db/schema";
import {
	expectOne,
	isForeignKeyConstraintError,
	isUniqueConstraintError,
} from "../../lib/db-helpers";
import { conflict, notFound } from "../../lib/errors";
import { parseBody, isResponse } from "../../lib/validation";
import { grantUserFeatureSchema } from "../../services/features";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/users/:userId/features" as const;

route.post(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, ADMIN_SCOPE);

	const userId = c.req.param("userId");
	const parsed = await parseBody(c, grantUserFeatureSchema);
	if (isResponse(parsed)) return parsed;

	try {
		const rows = await getDB(c.env.DB)
			.insert(userFeatures)
			.values({
				userId,
				featureSlug: parsed.featureSlug,
				limitValue: parsed.limitValue ?? null,
			})
			.returning();
		return c.json(
			itemResponse(expectOne(rows, "User feature insert")),
			201,
		);
	} catch (err) {
		if (isUniqueConstraintError(err)) {
			return conflict(c, "User already has this feature");
		}
		if (isForeignKeyConstraintError(err))
			return notFound(c, "Feature");
		throw err;
	}
});

export default {
	route,
	method: "POST" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Grant feature to user",
	auth_required: true,
	scopes: [ADMIN_SCOPE],
};
