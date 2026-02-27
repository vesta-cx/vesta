/** @format */

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { runListQuery } from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth } from "../../auth/helpers";
import { getDB } from "../../db";
import { externalLinks } from "../../db/schema";
import { forbidden, singleError } from "../../lib/errors";
import {
	externalLinkListConfig,
	externalLinkSubjectTypeSchema,
	scopeForSubjectType,
} from "./shared";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.get("/links/:subjectType/:subjectId", async (c) => {
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

	const readScope = scopeForSubjectType(subjectTypeParsed.data, "read");
	if (!hasScope(auth, readScope)) {
		return forbidden(c);
	}

	const envelope = await runListQuery({
		db: getDB(c.env.DB),
		table: externalLinks,
		input: new URL(c.req.url).searchParams,
		config: externalLinkListConfig,
		baseWhere: and(
			eq(externalLinks.subjectType, subjectTypeParsed.data),
			eq(externalLinks.subjectId, c.req.param("subjectId")),
		),
		mode: "envelope",
	});

	return c.json(envelope);
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/links/:subjectType/:subjectId",
	description: "List external links for a subject",
	auth_required: true,
	scopes: ["resources:read", "workspaces:read"],
};
