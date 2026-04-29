/** @format */

import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope } from "../../auth/helpers";
import { ADMIN_SCOPE } from "../../auth/types";
import { getDB } from "../../db";
import { workspaces } from "../../db/schema";
import { isUniqueConstraintError } from "../../lib/db-helpers";
import { conflict, notFound } from "../../lib/errors";
import { parseBody, isResponse } from "../../lib/validation";
import {
	updateWorkspaceSchema,
	workspaceMutationWhere,
} from "../../services/workspaces";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/workspaces/:id" as const;

route.put(PATH, async (c) => {
	const id = c.req.param("id");
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "workspaces:write");

	const parsed = await parseBody(c, updateWorkspaceSchema);
	if (isResponse(parsed)) return parsed;

	try {
		const [row] = await getDB(c.env.DB)
			.update(workspaces)
			.set({ ...parsed, updatedAt: new Date() })
			.where(workspaceMutationWhere(auth, id))
			.returning();
		return row ?
				c.json(itemResponse(row))
			:	notFound(c, "Workspace");
	} catch (err) {
		if (isUniqueConstraintError(err)) {
			return conflict(
				c,
				"Workspace with this slug already exists",
				"slug",
			);
		}
		throw err;
	}
});

export default {
	route,
	method: "PUT" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Update workspace",
	auth_required: true,
	scopes: ["workspaces:write"],
	scopes_any: [ADMIN_SCOPE, "workspaces:write"],
};
