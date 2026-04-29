/** @format */

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth, requireScope } from "../../auth/helpers";
import { ADMIN_SCOPE } from "../../auth/types";
import { getDB } from "../../db";
import { teams } from "../../db/schema";
import { isUniqueConstraintError } from "../../lib/db-helpers";
import { conflict, notFound } from "../../lib/errors";
import { parseBody, isResponse } from "../../lib/validation";
import { updateTeamSchema } from "../../services/teams";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/teams/:id" as const;

route.put(PATH, async (c) => {
	const id = c.req.param("id");
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "teams:write");

	const parsed = await parseBody(c, updateTeamSchema);
	if (isResponse(parsed)) return parsed;

	const where =
		hasScope(auth, ADMIN_SCOPE) ?
			eq(teams.id, id)
		:	and(eq(teams.id, id), eq(teams.ownerId, auth.subjectId));

	try {
		const [row] = await getDB(c.env.DB)
			.update(teams)
			.set({ ...parsed, updatedAt: new Date() })
			.where(where)
			.returning();
		return row ? c.json(itemResponse(row)) : notFound(c, "Team");
	} catch (err) {
		if (isUniqueConstraintError(err))
			return conflict(c, "Team update conflict");
		throw err;
	}
});

export default {
	route,
	method: "PUT" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Update team",
	auth_required: true,
	scopes: ["teams:write"],
	scopes_any: [ADMIN_SCOPE, "teams:write"],
};
