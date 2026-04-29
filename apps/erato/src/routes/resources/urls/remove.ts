/** @format */

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { requireAuth, requireScope } from "../../../auth/helpers";
import { ADMIN_SCOPE } from "../../../auth/types";
import { getDB } from "../../../db";
import { externalLinks } from "../../../db/schema";
import { notFound } from "../../../lib/errors";
import { isResponse } from "../../../lib/validation";
import {
	RESOURCE_LINK_SUBJECT_TYPE,
	canMutateResource,
} from "../../../services/resources";
import { parsePositionParam } from "../../links/shared";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();
const PATH = "/resources/:resourceId/urls/:position" as const;

route.delete(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "resources:write");

	const position = parsePositionParam(c);
	if (isResponse(position)) return position;

	const db = getDB(c.env.DB);
	const resourceId = c.req.param("resourceId");
	if (!(await canMutateResource(db, auth, resourceId))) {
		return notFound(c, "Resource");
	}

	const [row] = await db
		.delete(externalLinks)
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

	if (!row) return notFound(c, "Resource URL");
	return c.body(null, 204);
});

export default {
	route,
	method: "DELETE" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Remove resource URL",
	auth_required: true,
	scopes: ["resources:write"],
	scopes_any: [ADMIN_SCOPE, "resources:write"],
};
