/** @format */

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { hasScope, requireAuth } from "../../auth/helpers";
import { getDB } from "../../db";
import { externalLinks } from "../../db/schema";
import { forbidden, notFound, singleError } from "../../lib/errors";
import {
	externalLinkSubjectTypeSchema,
	scopeForSubjectType,
} from "./shared";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.delete("/links/:subjectType/:subjectId/:position", async (c) => {
	const auth = requireAuth(c.get("auth"));
	const subjectTypeParsed = externalLinkSubjectTypeSchema.safeParse(
		c.req.param("subjectType"),
	);
	if (!subjectTypeParsed.success) {
		return singleError(
			c,
			422,
			"Invalid subjectType. Use 'resource' or 'workspace'.",
			"VALIDATION_ERROR",
			"subjectType",
		);
	}

	const writeScope = scopeForSubjectType(subjectTypeParsed.data, "write");
	if (!hasScope(auth, writeScope)) {
		return forbidden(c);
	}

	const db = getDB(c.env.DB);
	const subjectId = c.req.param("subjectId");
	const position = parseInt(c.req.param("position"), 10);

	const [row] = await db
		.delete(externalLinks)
		.where(
			and(
				eq(externalLinks.subjectType, subjectTypeParsed.data),
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
	method: "DELETE" as RouteMetadata["method"],
	path: "/links/:subjectType/:subjectId/:position",
	description: "Remove external link from a subject",
	auth_required: true,
	scopes: ["resources:write", "workspaces:write"],
};
