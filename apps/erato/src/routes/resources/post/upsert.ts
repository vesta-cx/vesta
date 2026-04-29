/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope } from "../../../auth/helpers";
import { ADMIN_SCOPE } from "../../../auth/types";
import { getDB } from "../../../db";
import { posts } from "../../../db/schema";
import {
	expectOne,
	isForeignKeyConstraintError,
} from "../../../lib/db-helpers";
import { notFound, singleError } from "../../../lib/errors";
import { parseBody, isResponse, z } from "../../../lib/validation";
import { canMutateResource } from "../../../services/resources";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const upsertPostSchema = z.object({
	body: z.string().min(1),
	bodyHtml: z.string().nullable().optional(),
	featuredImage: z.string().url().nullable().optional(),
});

const route = new Hono<AppEnv>();
const PATH = "/resources/:resourceId/post" as const;

route.put(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "resources:write");

	const parsed = await parseBody(c, upsertPostSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDB(c.env.DB);
	const resourceId = c.req.param("resourceId");
	if (!(await canMutateResource(db, auth, resourceId))) {
		return notFound(c, "Resource");
	}

	const [existing] = await db
		.select({ resourceId: posts.resourceId })
		.from(posts)
		.where(eq(posts.resourceId, resourceId))
		.limit(1);

	try {
		const rows = await db
			.insert(posts)
			.values({ resourceId, ...parsed })
			.onConflictDoUpdate({
				target: posts.resourceId,
				set: parsed,
			})
			.returning();
		return c.json(
			itemResponse(expectOne(rows, "Resource post upsert")),
			existing ? 200 : 201,
		);
	} catch (err) {
		if (isForeignKeyConstraintError(err)) {
			return singleError(
				c,
				422,
				"Referenced resource does not exist",
				"VALIDATION_ERROR",
				"resourceId",
			);
		}
		throw err;
	}
});

export default {
	route,
	method: "PUT" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Create or update resource post",
	auth_required: true,
	scopes: ["resources:write"],
	scopes_any: [ADMIN_SCOPE, "resources:write"],
};
