/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import {
	runListQuery,
	type ListQueryConfig,
} from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth } from "../../../auth/helpers";
import { ADMIN_SCOPE } from "../../../auth/types";
import { getDB } from "../../../db";
import { resourceAuthors } from "../../../db/schema";
import { forbidden, notFound } from "../../../lib/errors";
import { canReadResource } from "../../../services/resources";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();
const PATH = "/resources/:resourceId/authors" as const;

const authorListConfig: ListQueryConfig = {
	filters: {
		author_type: { column: resourceAuthors.authorType },
		author_id: { column: resourceAuthors.authorId },
	},
	sortable: {
		author_id: resourceAuthors.authorId,
		author_type: resourceAuthors.authorType,
	},
	defaultSort: { key: "author_id", dir: "asc" },
};

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
		table: resourceAuthors,
		input: new URLSearchParams(
			c.req.query() as Record<string, string>,
		),
		config: authorListConfig,
		baseWhere: eq(resourceAuthors.resourceId, resourceId),
		mode: "envelope",
	});
	return c.json(envelope);
});

export default {
	route,
	method: "GET" satisfies RouteMetadata["method"],
	path: PATH,
	description: "List resource authors",
	auth_required: true,
	scopes: ["resources:read"],
	scopes_any: [ADMIN_SCOPE, "resources:read"],
};
