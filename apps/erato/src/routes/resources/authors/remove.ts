/** @format */

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { requireAuth, requireScope } from "../../../auth/helpers";
import { getDB } from "../../../db";
import { resourceAuthors } from "../../../db/schema";
import { notFound } from "../../../lib/errors";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();

route.delete(
	"/resources/:resourceId/authors/:authorType/:authorId",
	async (c) => {
		const auth = requireAuth(c.get("auth"));

		requireScope(auth, "resources:write");

		const db = getDB(c.env.DB);
		const { resourceId, authorType, authorId } = c.req.param();

		const [row] = await db
			.delete(resourceAuthors)
			.where(
				and(
					eq(
						resourceAuthors.resourceId,
						resourceId,
					),
					eq(
						resourceAuthors.authorType,
						authorType as
							| "user"
							| "workspace",
					),
					eq(resourceAuthors.authorId, authorId),
				),
			)
			.returning();

		if (!row) return notFound(c, "Resource author");
		return c.body(null, 204);
	},
);

export default {
	route,
	method: "DELETE" as RouteMetadata["method"],
	path: "/resources/:resourceId/authors/:authorType/:authorId",
	description: "Remove author from resource",
	auth_required: true,
	scopes: ["resources:write"],
};
