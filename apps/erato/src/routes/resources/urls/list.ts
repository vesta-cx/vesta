/** @format */

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import {
	runListQuery,
} from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth } from "../../../auth/helpers";
import { getDB } from "../../../db";
import { externalLinks } from "../../../db/schema";
import { forbidden } from "../../../lib/errors";
import { externalLinkListConfig } from "../../links/shared";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();

route.get("/resources/:resourceId/urls", async (c) => {
	const auth = requireAuth(c.get("auth"));
	if (!hasScope(auth, "resources:read")) {
		return forbidden(c);
	}

	const envelope = await runListQuery({
		db: getDB(c.env.DB),
		table: externalLinks,
		input: new URL(c.req.url).searchParams,
		config: externalLinkListConfig,
		baseWhere: and(
			eq(externalLinks.subjectType, "resource"),
			eq(externalLinks.subjectId, c.req.param("resourceId")),
		),
		mode: "envelope",
	});
	return c.json(envelope);
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/resources/:resourceId/urls",
	description: "List resource URLs",
	auth_required: true,
	scopes: ["resources:read"],
};
