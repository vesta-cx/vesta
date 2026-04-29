/** @format */

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { runListQuery } from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth } from "../../../auth/helpers";
import { ADMIN_SCOPE } from "../../../auth/types";
import { getDB } from "../../../db";
import { externalLinks } from "../../../db/schema";
import { forbidden, notFound } from "../../../lib/errors";
import {
	RESOURCE_LINK_SUBJECT_TYPE,
	canReadResource,
} from "../../../services/resources";
import { externalLinkListConfig } from "../../links/shared";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();
const PATH = "/resources/:resourceId/urls" as const;

route.get(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	if (!hasScope(auth, "resources:read")) return forbidden(c);

	const db = getDB(c.env.DB);
	const resourceId = c.req.param("resourceId");
	if (!(await canReadResource(db, auth, resourceId))) {
		return notFound(c, "Resource");
	}

	const envelope = await runListQuery({
		db,
		table: externalLinks,
		input: new URLSearchParams(
			c.req.query() as Record<string, string>,
		),
		config: externalLinkListConfig,
		baseWhere: and(
			eq(
				externalLinks.subjectType,
				RESOURCE_LINK_SUBJECT_TYPE,
			),
			eq(externalLinks.subjectId, resourceId),
		),
		mode: "envelope",
	});
	return c.json(envelope);
});

export default {
	route,
	method: "GET" satisfies RouteMetadata["method"],
	path: PATH,
	description: "List resource URLs",
	auth_required: true,
	scopes: ["resources:read"],
	scopes_any: [ADMIN_SCOPE, "resources:read"],
};
