/** @format */

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { requireAuth, requireScope } from "../../../auth/helpers";
import { ADMIN_SCOPE } from "../../../auth/types";
import { getDB } from "../../../db";
import { externalLinks } from "../../../db/schema";
import { notFound } from "../../../lib/errors";
import { isResponse } from "../../../lib/validation";
import {
	WORKSPACE_LINK_SUBJECT_TYPE,
	canMutateWorkspace,
} from "../../../services/workspaces";
import { parsePositionParam } from "../../links/shared";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();
const PATH = "/workspaces/:workspaceId/urls/:position" as const;

route.delete(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "workspaces:write");

	const position = parsePositionParam(c);
	if (isResponse(position)) return position;

	const db = getDB(c.env.DB);
	const workspaceId = c.req.param("workspaceId");
	if (!(await canMutateWorkspace(db, auth, workspaceId))) {
		return notFound(c, "Workspace");
	}

	const [row] = await db
		.delete(externalLinks)
		.where(
			and(
				eq(
					externalLinks.subjectType,
					WORKSPACE_LINK_SUBJECT_TYPE,
				),
				eq(externalLinks.subjectId, workspaceId),
				eq(externalLinks.position, position),
			),
		)
		.returning();

	if (!row) return notFound(c, "Workspace URL");
	return c.body(null, 204);
});

export default {
	route,
	method: "DELETE" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Remove workspace URL",
	auth_required: true,
	scopes: ["workspaces:write"],
	scopes_any: [ADMIN_SCOPE, "workspaces:write"],
};
