/** @format */

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { runListQuery } from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth } from "../../../auth/helpers";
import { ADMIN_SCOPE } from "../../../auth/types";
import { getDB } from "../../../db";
import { externalLinks } from "../../../db/schema";
import { forbidden, notFound } from "../../../lib/errors";
import {
	WORKSPACE_LINK_SUBJECT_TYPE,
	canReadWorkspace,
} from "../../../services/workspaces";
import { externalLinkListConfig } from "../../links/shared";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();
const PATH = "/workspaces/:workspaceId/urls" as const;

route.get(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	if (!hasScope(auth, "workspaces:read")) return forbidden(c);

	const db = getDB(c.env.DB);
	const workspaceId = c.req.param("workspaceId");
	if (!(await canReadWorkspace(db, auth, workspaceId))) {
		return notFound(c, "Workspace");
	}

	const envelope = await runListQuery({
		db,
		table: externalLinks,
		input: new URLSearchParams(
			c.req.query() as Record<string, string>,
		),
		config: externalLinkListConfig,
		baseWhere: and(
			eq(
				externalLinks.subjectType,
				WORKSPACE_LINK_SUBJECT_TYPE,
			),
			eq(externalLinks.subjectId, workspaceId),
		),
		mode: "envelope",
	});
	return c.json(envelope);
});

export default {
	route,
	method: "GET" satisfies RouteMetadata["method"],
	path: PATH,
	description: "List workspace URLs",
	auth_required: true,
	scopes: ["workspaces:read"],
	scopes_any: [ADMIN_SCOPE, "workspaces:read"],
};
