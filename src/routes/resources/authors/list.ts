/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import {
	runListQuery,
	type ListQueryConfig,
} from "@mia-cx/drizzle-query-factory";
import { hasScope, isAuthenticated } from "../../../auth/helpers";
import { getDB } from "../../../db";
import { resourceAuthors } from "../../../db/schema";
import { forbidden } from "../../../lib/errors";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();

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

route.get("/resources/:resourceId/authors", async (c) => {
	const auth = c.get("auth");
	if (isAuthenticated(auth) && !hasScope(auth, "resources:read")) {
		return forbidden(c);
	}

	const envelope = await runListQuery({
		db: getDB(c.env.DB),
		table: resourceAuthors,
		input: new URL(c.req.url).searchParams,
		config: authorListConfig,
		baseWhere: eq(
			resourceAuthors.resourceId,
			c.req.param("resourceId"),
		),
		mode: "envelope",
	});
	return c.json(envelope);
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/resources/:resourceId/authors",
	description: "List resource authors",
	auth_required: false,
	scopes: ["resources:read"],
};
