/** @format */

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope } from "../../../auth/helpers";
import { getDB } from "../../../db";
import { externalLinks } from "../../../db/schema";
import { notFound } from "../../../lib/errors";
import { parseBody, isResponse } from "../../../lib/validation";
import { updateExternalLinkSchema } from "../../links/shared";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();

route.put("/resources/:resourceId/urls/:position", async (c) => {
	const auth = requireAuth(c.get("auth"));

	requireScope(auth, "resources:write");

	const parsed = await parseBody(c, updateExternalLinkSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDB(c.env.DB);
	const resourceId = c.req.param("resourceId");
	const position = parseInt(c.req.param("position"), 10);

	const [row] = await db
		.update(externalLinks)
		.set({ ...parsed, updatedAt: new Date() })
		.where(
			and(
				eq(externalLinks.subjectType, "resource"),
				eq(externalLinks.subjectId, resourceId),
				eq(externalLinks.position, position),
			),
		)
		.returning();

	return row ? c.json(itemResponse(row)) : notFound(c, "Resource URL");
});

export default {
	route,
	method: "PUT" as RouteMetadata["method"],
	path: "/resources/:resourceId/urls/:position",
	description: "Update resource URL",
	auth_required: true,
	scopes: ["resources:write"],
};
