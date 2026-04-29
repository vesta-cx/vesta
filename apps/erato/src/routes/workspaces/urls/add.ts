/** @format */

import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope } from "../../../auth/helpers";
import { ADMIN_SCOPE } from "../../../auth/types";
import { getDB } from "../../../db";
import { externalLinks } from "../../../db/schema";
import { expectOne, isUniqueConstraintError } from "../../../lib/db-helpers";
import { conflict, notFound } from "../../../lib/errors";
import { parseBody, isResponse } from "../../../lib/validation";
import {
	WORKSPACE_LINK_SUBJECT_TYPE,
	canMutateWorkspace,
} from "../../../services/workspaces";
import { addExternalLinkSchema } from "../../links/shared";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();
const PATH = "/workspaces/:workspaceId/urls" as const;

route.post(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "workspaces:write");

	const parsed = await parseBody(c, addExternalLinkSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDB(c.env.DB);
	const workspaceId = c.req.param("workspaceId");
	if (!(await canMutateWorkspace(db, auth, workspaceId))) {
		return notFound(c, "Workspace");
	}

	try {
		const rows = await db
			.insert(externalLinks)
			.values({
				subjectType: WORKSPACE_LINK_SUBJECT_TYPE,
				subjectId: workspaceId,
				...parsed,
			})
			.returning();
		return c.json(
			itemResponse(expectOne(rows, "Workspace URL insert")),
			201,
		);
	} catch (err) {
		if (isUniqueConstraintError(err)) {
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
	method: "POST" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Add URL to workspace",
	auth_required: true,
	scopes: ["workspaces:write"],
	scopes_any: [ADMIN_SCOPE, "workspaces:write"],
};
