/** @format */

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope } from "../../../auth/helpers";
import { ADMIN_SCOPE } from "../../../auth/types";
import { getDB } from "../../../db";
import { externalLinks } from "../../../db/schema";
import { notFound } from "../../../lib/errors";
import { parseBody, isResponse } from "../../../lib/validation";
import {
	RESOURCE_LINK_SUBJECT_TYPE,
	canMutateResource,
} from "../../../services/resources";
import {
	parsePositionParam,
	updateExternalLinkSchema,
} from "../../links/shared";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();
const PATH = "/resources/:resourceId/urls/:position" as const;

route.put(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "resources:write");

	const parsed = await parseBody(c, updateExternalLinkSchema);
	if (isResponse(parsed)) return parsed;

	const position = parsePositionParam(c);
	if (isResponse(position)) return position;

	const db = getDB(c.env.DB);
	const resourceId = c.req.param("resourceId");
	if (!(await canMutateResource(db, auth, resourceId))) {
		return notFound(c, "Resource");
	}

	const [row] = await db
		.update(externalLinks)
		.set({ ...parsed, updatedAt: new Date() })
		.where(
			and(
				eq(
					externalLinks.subjectType,
					RESOURCE_LINK_SUBJECT_TYPE,
				),
				eq(externalLinks.subjectId, resourceId),
				eq(externalLinks.position, position),
			),
		)
		.returning();

	return row ? c.json(itemResponse(row)) : notFound(c, "Resource URL");
});

export default {
	route,
	method: "PUT" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Update resource URL",
	auth_required: true,
	scopes: ["resources:write"],
	scopes_any: [ADMIN_SCOPE, "resources:write"],
};
