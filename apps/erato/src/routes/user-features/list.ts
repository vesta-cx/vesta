/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { runListQuery } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope, hasScope } from "../../auth/helpers";
import { ADMIN_SCOPE } from "../../auth/types";
import { getDB } from "../../db";
import { userFeatures } from "../../db/schema";
import { forbidden } from "../../lib/errors";
import { userFeatureListConfig } from "../../services/features";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/users/:userId/features" as const;

route.get(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "users:read");

	const userId = c.req.param("userId");
	if (!hasScope(auth, ADMIN_SCOPE) && auth.subjectId !== userId)
		return forbidden(c);

	const envelope = await runListQuery({
		db: getDB(c.env.DB),
		table: userFeatures,
		input: new URLSearchParams(
			c.req.query() as Record<string, string>,
		),
		config: userFeatureListConfig,
		baseWhere: eq(userFeatures.userId, userId),
		mode: "envelope",
	});
	return c.json(envelope);
});

export default {
	route,
	method: "GET" satisfies RouteMetadata["method"],
	path: PATH,
	description: "List user features",
	auth_required: true,
	scopes: ["users:read"],
	scopes_any: [ADMIN_SCOPE, "users:read"],
};
