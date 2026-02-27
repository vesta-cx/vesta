/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import {
	runListQuery,
	type ListQueryConfig,
} from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope } from "../../auth/helpers";
import { getDB } from "../../db";
import { userFeatures } from "../../db/schema";
import { forbidden } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

const userFeatureListConfig: ListQueryConfig = {
	filters: {
		feature_slug: { column: userFeatures.featureSlug },
	},
	sortable: {
		feature_slug: userFeatures.featureSlug,
	},
	defaultSort: { key: "feature_slug", dir: "asc" },
};

route.get("/users/:userId/features", async (c) => {
	const auth = c.get("auth");
	const apiAuth = requireAuth(auth);
	requireScope(auth, "users:read");

	const userId = c.req.param("userId");
	const isAdmin = apiAuth.scopes.includes("admin");
	if (!isAdmin && apiAuth.subjectId !== userId) return forbidden(c);

	const envelope = await runListQuery({
		db: getDB(c.env.DB),
		table: userFeatures,
		input: new URL(c.req.url).searchParams,
		config: userFeatureListConfig,
		baseWhere: eq(userFeatures.userId, userId),
		mode: "envelope",
	});
	return c.json(envelope);
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/users/:userId/features",
	description: "List user features",
	auth_required: true,
	scopes: ["users:read"],
};
