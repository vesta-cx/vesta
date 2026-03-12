/** @format */

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth } from "../../auth/helpers";
import { getDB } from "../../db";
import { externalLinks } from "../../db/schema";
import { forbidden, notFound, singleError } from "../../lib/errors";
import { parseBody, isResponse } from "../../lib/validation";
import {
	externalLinkSubjectTypeSchema,
	scopeForSubjectType,
	updateExternalLinkSchema,
} from "./shared";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.put("/links/:subjectType/:subjectId/:position", async (c) => {
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

	const parsed = await parseBody(c, updateExternalLinkSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDB(c.env.DB);
	const subjectId = c.req.param("subjectId");
	const position = parseInt(c.req.param("position"), 10);

	const [row] = await db
		.update(externalLinks)
		.set({ ...parsed, updatedAt: new Date() })
		.where(
			and(
				eq(externalLinks.subjectType, subjectTypeParsed.data),
				eq(externalLinks.subjectId, subjectId),
				eq(externalLinks.position, position),
			),
		)
		.returning();

	return row ? c.json(itemResponse(row)) : notFound(c, "External link");
});

export default {
	route,
	method: "PUT" as RouteMetadata["method"],
	path: "/links/:subjectType/:subjectId/:position",
	description: "Update external link for a subject",
	auth_required: true,
	scopes: ["resources:write", "workspaces:write"],
};
