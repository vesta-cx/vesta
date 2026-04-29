/** @format */

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope } from "../../../auth/helpers";
import { ADMIN_SCOPE } from "../../../auth/types";
import { getDB } from "../../../db";
import { externalLinks } from "../../../db/schema";
import { notFound } from "../../../lib/errors";
import { parseBody, isResponse } from "../../../lib/validation";
import {
	WORKSPACE_LINK_SUBJECT_TYPE,
	canMutateWorkspace,
} from "../../../services/workspaces";
import {
	parsePositionParam,
	updateExternalLinkSchema,
} from "../../links/shared";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();
const PATH = "/workspaces/:workspaceId/urls/:position" as const;

route.put(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "workspaces:write");

	const parsed = await parseBody(c, updateExternalLinkSchema);
	if (isResponse(parsed)) return parsed;

	const position = parsePositionParam(c);
	if (isResponse(position)) return position;

	const db = getDB(c.env.DB);
	const workspaceId = c.req.param("workspaceId");
	if (!(await canMutateWorkspace(db, auth, workspaceId))) {
		return notFound(c, "Workspace");
	}

	const [row] = await db
		.update(externalLinks)
		.set({ ...parsed, updatedAt: new Date() })
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

	return row ? c.json(itemResponse(row)) : notFound(c, "Workspace URL");
});

export default {
	route,
	method: "PUT" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Update workspace URL",
	auth_required: true,
	scopes: ["workspaces:write"],
	scopes_any: [ADMIN_SCOPE, "workspaces:write"],
};
