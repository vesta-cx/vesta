/** @format */

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { hasScope, requireAuth, requireScope } from "../../auth/helpers";
import { ADMIN_SCOPE } from "../../auth/types";
import { getDB } from "../../db";
import { teamUsers, teams } from "../../db/schema";
import { notFound } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/teams/:id" as const;

route.delete(PATH, async (c) => {
	const id = c.req.param("id");
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "teams:write");

	const deleted = await getDB(c.env.DB).transaction(async (tx) => {
		const where =
			hasScope(auth, ADMIN_SCOPE) ?
				eq(teams.id, id)
			:	and(
					eq(teams.id, id),
					eq(teams.ownerId, auth.subjectId),
				);
		const [team] = await tx
			.select({ id: teams.id })
			.from(teams)
			.where(where)
			.limit(1);
		if (!team) return false;

		await tx.delete(teamUsers).where(eq(teamUsers.teamId, id));
		await tx.delete(teams).where(eq(teams.id, id));
		return true;
	});

	return deleted ? c.body(null, 204) : notFound(c, "Team");
});

export default {
	route,
	method: "DELETE" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Delete team",
	auth_required: true,
	scopes: ["teams:write"],
	scopes_any: [ADMIN_SCOPE, "teams:write"],
};
