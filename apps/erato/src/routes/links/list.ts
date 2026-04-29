/** @format */

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { runListQuery } from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth } from "../../auth/helpers";
import { getDB } from "../../db";
import { externalLinks } from "../../db/schema";
import { forbidden } from "../../lib/errors";
import {
	externalLinkListConfig,
	parseSubjectType,
	scopeForSubjectType,
} from "./shared";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/links/:subjectType/:subjectId" as const;

route.get(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	const subjectType = parseSubjectType(c);
	if (subjectType instanceof Response) return subjectType;

	const readScope = scopeForSubjectType(subjectType, "read");
	if (!hasScope(auth, readScope)) return forbidden(c);

	const envelope = await runListQuery({
		db: getDB(c.env.DB),
		table: externalLinks,
		input: new URLSearchParams(
			c.req.query() as Record<string, string>,
		),
		config: externalLinkListConfig,
		baseWhere: and(
			eq(externalLinks.subjectType, subjectType),
			eq(externalLinks.subjectId, c.req.param("subjectId")),
		),
		mode: "envelope",
	});

	return c.json(envelope);
});

export default {
	route,
	method: "GET" satisfies RouteMetadata["method"],
	path: PATH,
	description: "List external links for a subject",
	auth_required: true,
	scopes_any: ["resources:read", "workspaces:read"],
};
