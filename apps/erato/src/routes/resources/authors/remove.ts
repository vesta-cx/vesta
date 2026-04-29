/** @format */

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { requireAuth, requireScope } from "../../../auth/helpers";
import { ADMIN_SCOPE } from "../../../auth/types";
import { getDB } from "../../../db";
import { AUTHOR_TYPES, resourceAuthors } from "../../../db/schema";
import { notFound, singleError } from "../../../lib/errors";
import { z } from "../../../lib/validation";
import { canMutateResource } from "../../../services/resources";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();
const PATH = "/resources/:resourceId/authors/:authorType/:authorId" as const;
const authorTypeSchema = z.enum(AUTHOR_TYPES);

route.delete(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "resources:write");

	const db = getDB(c.env.DB);
	const { resourceId, authorId } = c.req.param();
	const parsedAuthorType = authorTypeSchema.safeParse(
		c.req.param("authorType"),
	);
	if (!parsedAuthorType.success) {
		return singleError(
			c,
			422,
			`authorType must be one of: ${AUTHOR_TYPES.join(", ")}`,
			"VALIDATION_ERROR",
			"authorType",
		);
	}
	if (!(await canMutateResource(db, auth, resourceId))) {
		return notFound(c, "Resource");
	}

	const [row] = await db
		.delete(resourceAuthors)
		.where(
			and(
				eq(resourceAuthors.resourceId, resourceId),
				eq(
					resourceAuthors.authorType,
					parsedAuthorType.data,
				),
				eq(resourceAuthors.authorId, authorId),
			),
		)
		.returning();

	if (!row) return notFound(c, "Resource author");
	return c.body(null, 204);
});

export default {
	route,
	method: "DELETE" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Remove author from resource",
	auth_required: true,
	scopes: ["resources:write"],
	scopes_any: [ADMIN_SCOPE, "resources:write"],
};
