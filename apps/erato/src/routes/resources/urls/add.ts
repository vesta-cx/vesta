/** @format */

import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope } from "../../../auth/helpers";
import { ADMIN_SCOPE } from "../../../auth/types";
import { getDB } from "../../../db";
import { externalLinks } from "../../../db/schema";
import { expectOne, isUniqueConstraintError } from "../../../lib/db-helpers";
import { conflict, notFound } from "../../../lib/errors";
import { parseBody, isResponse } from "../../../lib/validation";
import {
	RESOURCE_LINK_SUBJECT_TYPE,
	canMutateResource,
} from "../../../services/resources";
import { addExternalLinkSchema } from "../../links/shared";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();
const PATH = "/resources/:resourceId/urls" as const;

route.post(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "resources:write");

	const parsed = await parseBody(c, addExternalLinkSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDB(c.env.DB);
	const resourceId = c.req.param("resourceId");
	if (!(await canMutateResource(db, auth, resourceId))) {
		return notFound(c, "Resource");
	}

	try {
		const rows = await db
			.insert(externalLinks)
			.values({
				subjectType: RESOURCE_LINK_SUBJECT_TYPE,
				subjectId: resourceId,
				...parsed,
			})
			.returning();
		return c.json(
			itemResponse(expectOne(rows, "Resource URL insert")),
			201,
		);
	} catch (err) {
		if (isUniqueConstraintError(err)) {
			return conflict(
				c,
				"URL at this position already exists",
				"position",
			);
		}
		throw err;
	}
});

export default {
	route,
	method: "POST" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Add URL to resource",
	auth_required: true,
	scopes: ["resources:write"],
	scopes_any: [ADMIN_SCOPE, "resources:write"],
};
