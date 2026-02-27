/** @format */

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { runListQuery } from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth } from "../../../auth/helpers";
import { getDB } from "../../../db";
import { externalLinks } from "../../../db/schema";
import { forbidden } from "../../../lib/errors";
import { externalLinkListConfig } from "../../links/shared";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();

route.get("/workspaces/:workspaceId/urls", async (c) => {
	const auth = requireAuth(c.get("auth"));
	if (!hasScope(auth, "workspaces:read")) {
		return forbidden(c);
	}

	const envelope = await runListQuery({
		db: getDB(c.env.DB),
		table: externalLinks,
		input: new URL(c.req.url).searchParams,
		config: externalLinkListConfig,
		baseWhere: and(
			eq(externalLinks.subjectType, "workspace"),
			eq(externalLinks.subjectId, c.req.param("workspaceId")),
		),
		mode: "envelope",
	});
	return c.json(envelope);
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/workspaces/:workspaceId/urls",
	description: "List workspace URLs",
	auth_required: true,
	scopes: ["workspaces:read"],
};
