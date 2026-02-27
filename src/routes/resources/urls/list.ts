/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { runListQuery, type ListQueryConfig } from "@mia-cx/drizzle-query-factory";
import { hasScope, isAuthenticated } from "../../../auth/helpers";
import { getDB } from "../../../db";
import { resourceUrls } from "../../../db/schema";
import { forbidden } from "../../../lib/errors";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();

const resourceUrlListConfig: ListQueryConfig = {
	filters: {
		position: { column: resourceUrls.position, parse: (value) => Number(value) },
	},
	sortable: { position: resourceUrls.position },
	defaultSort: { key: "position", dir: "asc" },
};

route.get("/resources/:resourceId/urls", async (c) => {
	const auth = c.get("auth");
	if (isAuthenticated(auth) && !hasScope(auth, "resources:read")) {
		return forbidden(c);
	}

	const envelope = await runListQuery({
		db: getDB(c.env.DB), table: resourceUrls,
		input: new URL(c.req.url).searchParams, config: resourceUrlListConfig,
		baseWhere: eq(resourceUrls.resourceId, c.req.param("resourceId")),
		mode: "envelope",
	});
	return c.json(envelope);
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/resources/:resourceId/urls",
	description: "List resource URLs",
	auth_required: false,
	scopes: ["resources:read"],
};
