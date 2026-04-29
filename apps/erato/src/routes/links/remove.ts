/** @format */

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { hasScope, requireAuth } from "../../auth/helpers";
import { getDB } from "../../db";
import { externalLinks } from "../../db/schema";
import { forbidden, notFound } from "../../lib/errors";
import {
	parsePositionParam,
	parseSubjectType,
	scopeForSubjectType,
} from "./shared";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/links/:subjectType/:subjectId/:position" as const;

route.delete(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	const subjectType = parseSubjectType(c);
	if (subjectType instanceof Response) return subjectType;

	const writeScope = scopeForSubjectType(subjectType, "write");
	if (!hasScope(auth, writeScope)) return forbidden(c);

	const position = parsePositionParam(c);
	if (position instanceof Response) return position;

	const db = getDB(c.env.DB);
	const subjectId = c.req.param("subjectId");

	const [row] = await db
		.delete(externalLinks)
		.where(
			and(
				eq(externalLinks.subjectType, subjectType),
				eq(externalLinks.subjectId, subjectId),
				eq(externalLinks.position, position),
			),
		)
		.returning();

	if (!row) return notFound(c, "External link");
	return c.body(null, 204);
});

export default {
	route,
	method: "DELETE" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Remove external link from a subject",
	auth_required: true,
	scopes_any: ["resources:write", "workspaces:write"],
};
