/** @format */

import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth } from "../../auth/helpers";
import { getDB } from "../../db";
import { externalLinks } from "../../db/schema";
import { conflict, forbidden } from "../../lib/errors";
import { expectOne, isUniqueConstraintError } from "../../lib/db-helpers";
import { parseBody, isResponse } from "../../lib/validation";
import {
	addExternalLinkSchema,
	parseSubjectType,
	scopeForSubjectType,
} from "./shared";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/links/:subjectType/:subjectId" as const;

route.post(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	const subjectType = parseSubjectType(c);
	if (subjectType instanceof Response) return subjectType;

	const writeScope = scopeForSubjectType(subjectType, "write");
	if (!hasScope(auth, writeScope)) return forbidden(c);

	const parsed = await parseBody(c, addExternalLinkSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDB(c.env.DB);
	const subjectId = c.req.param("subjectId");

	try {
		const rows = await db
			.insert(externalLinks)
			.values({
				subjectType,
				subjectId,
				...parsed,
			})
			.returning();
		return c.json(
			itemResponse(expectOne(rows, "External link insert")),
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
	description: "Add external link to a subject",
	auth_required: true,
	scopes_any: ["resources:write", "workspaces:write"],
};
