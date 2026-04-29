/** @format */

import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope } from "../../../auth/helpers";
import { ADMIN_SCOPE } from "../../../auth/types";
import { getDB } from "../../../db";
import { AUTHOR_TYPES, resourceAuthors } from "../../../db/schema";
import { expectOne, isUniqueConstraintError } from "../../../lib/db-helpers";
import { conflict, notFound } from "../../../lib/errors";
import { parseBody, isResponse, z } from "../../../lib/validation";
import { canMutateResource } from "../../../services/resources";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const addAuthorSchema = z.object({
	authorType: z.enum(AUTHOR_TYPES),
	authorId: z.string().min(1),
	role: z.string().nullable().optional(),
});

const route = new Hono<AppEnv>();
const PATH = "/resources/:resourceId/authors" as const;

route.post(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "resources:write");

	const parsed = await parseBody(c, addAuthorSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDB(c.env.DB);
	const resourceId = c.req.param("resourceId");
	if (!(await canMutateResource(db, auth, resourceId))) {
		return notFound(c, "Resource");
	}

	try {
		const rows = await db
			.insert(resourceAuthors)
			.values({ resourceId, ...parsed })
			.returning();
		return c.json(
			itemResponse(expectOne(rows, "Resource author insert")),
			201,
		);
	} catch (err) {
		if (isUniqueConstraintError(err)) {
			return conflict(
				c,
				"Author already linked to this resource",
			);
		}
		throw err;
	}
});

export default {
	route,
	method: "POST" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Add author to resource",
	auth_required: true,
	scopes: ["resources:write"],
	scopes_any: [ADMIN_SCOPE, "resources:write"],
};
