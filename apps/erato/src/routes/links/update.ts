/** @format */

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth } from "../../auth/helpers";
import { getDB } from "../../db";
import { externalLinks } from "../../db/schema";
import { forbidden, notFound } from "../../lib/errors";
import { parseBody, isResponse } from "../../lib/validation";
import {
	parsePositionParam,
	parseSubjectType,
	scopeForSubjectType,
	updateExternalLinkSchema,
} from "./shared";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/links/:subjectType/:subjectId/:position" as const;

route.put(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	const subjectType = parseSubjectType(c);
	if (subjectType instanceof Response) return subjectType;

	const writeScope = scopeForSubjectType(subjectType, "write");
	if (!hasScope(auth, writeScope)) return forbidden(c);

	const parsed = await parseBody(c, updateExternalLinkSchema);
	if (isResponse(parsed)) return parsed;

	const position = parsePositionParam(c);
	if (position instanceof Response) return position;

	const db = getDB(c.env.DB);
	const subjectId = c.req.param("subjectId");

	const [row] = await db
		.update(externalLinks)
		.set({ ...parsed, updatedAt: new Date() })
		.where(
			and(
				eq(externalLinks.subjectType, subjectType),
				eq(externalLinks.subjectId, subjectId),
				eq(externalLinks.position, position),
			),
		)
		.returning();

	return row ? c.json(itemResponse(row)) : notFound(c, "External link");
});

export default {
	route,
	method: "PUT" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Update external link for a subject",
	auth_required: true,
	scopes_any: ["resources:write", "workspaces:write"],
};
