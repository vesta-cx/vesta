/** @format */

import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth } from "../../auth/helpers";
import { getDB } from "../../db";
import { externalLinks } from "../../db/schema";
import { conflict, forbidden, singleError } from "../../lib/errors";
import { parseBody, isResponse } from "../../lib/validation";
import {
	addExternalLinkSchema,
	externalLinkSubjectTypeSchema,
	scopeForSubjectType,
} from "./shared";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.post("/links/:subjectType/:subjectId", async (c) => {
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

	const parsed = await parseBody(c, addExternalLinkSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDB(c.env.DB);
	const subjectId = c.req.param("subjectId");

	try {
		const [row] = await db
			.insert(externalLinks)
			.values({
				subjectType: subjectTypeParsed.data,
				subjectId,
				...parsed,
			})
			.returning();
		return c.json(itemResponse(row!), 201);
	} catch (err) {
		if (err instanceof Error && /UNIQUE/i.test(err.message)) {
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
	method: "POST" as RouteMetadata["method"],
	path: "/links/:subjectType/:subjectId",
	description: "Add external link to a subject",
	auth_required: true,
	scopes: ["resources:write", "workspaces:write"],
};
