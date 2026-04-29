/** @format */

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth, requireScope } from "../../auth/helpers";
import { ADMIN_SCOPE } from "../../auth/types";
import { getDB } from "../../db";
import { teams } from "../../db/schema";
import { notFound } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/teams/:id" as const;

route.get(PATH, async (c) => {
	const id = c.req.param("id");
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "teams:read");

	const where =
		hasScope(auth, ADMIN_SCOPE) ?
			eq(teams.id, id)
		:	and(eq(teams.id, id), eq(teams.ownerId, auth.subjectId));
	const [row] = await getDB(c.env.DB)
		.select()
		.from(teams)
		.where(where)
		.limit(1);
	return row ? c.json(itemResponse(row)) : notFound(c, "Team");
});

export default {
	route,
	method: "GET" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Get team by id",
	auth_required: true,
	scopes: ["teams:read"],
	scopes_any: [ADMIN_SCOPE, "teams:read"],
};
