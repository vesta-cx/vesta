/** @format */

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth } from "../../auth/helpers";
import { ADMIN_SCOPE } from "../../auth/types";
import { getDB } from "../../db";
import { workspaces } from "../../db/schema";
import { forbidden, notFound } from "../../lib/errors";
import { workspaceAccessWhere } from "../../services/workspaces";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/workspaces/:id" as const;

route.get(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	const db = getDB(c.env.DB);
	const id = c.req.param("id");

	if (!hasScope(auth, "workspaces:read")) return forbidden(c);

	const accessWhere =
		hasScope(auth, ADMIN_SCOPE) ?
			eq(workspaces.id, id)
		:	and(eq(workspaces.id, id), workspaceAccessWhere(db, auth, id));

	const [row] = await db
		.select()
		.from(workspaces)
		.where(accessWhere)
		.limit(1);
	return row ? c.json(itemResponse(row)) : notFound(c, "Workspace");
});

export default {
	route,
	method: "GET" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Get workspace by id",
	auth_required: true,
	scopes: ["workspaces:read"],
	scopes_any: [ADMIN_SCOPE, "workspaces:read"],
};
