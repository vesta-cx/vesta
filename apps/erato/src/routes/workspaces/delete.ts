/** @format */

import { Hono } from "hono";
import { requireAuth, requireScope } from "../../auth/helpers";
import { ADMIN_SCOPE } from "../../auth/types";
import { getDB } from "../../db";
import { workspaces } from "../../db/schema";
import { notFound } from "../../lib/errors";
import { workspaceMutationWhere } from "../../services/workspaces";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/workspaces/:id" as const;

route.delete(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "workspaces:write");

	const [row] = await getDB(c.env.DB)
		.delete(workspaces)
		.where(workspaceMutationWhere(auth, c.req.param("id")))
		.returning({ id: workspaces.id });
	if (!row) return notFound(c, "Workspace");

	return c.body(null, 204);
});

export default {
	route,
	method: "DELETE" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Delete workspace",
	auth_required: true,
	scopes: ["workspaces:write"],
	scopes_any: [ADMIN_SCOPE, "workspaces:write"],
};
