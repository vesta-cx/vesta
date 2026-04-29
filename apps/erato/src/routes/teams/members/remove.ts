/** @format */

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { hasScope, requireAuth, requireScope } from "../../../auth/helpers";
import { ADMIN_SCOPE } from "../../../auth/types";
import { getDB } from "../../../db";
import { teamUsers, teams } from "../../../db/schema";
import { conflict, forbidden, notFound } from "../../../lib/errors";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();
const PATH = "/teams/:teamId/members/:userId" as const;

route.delete(PATH, async (c) => {
	const { teamId, userId } = c.req.param();
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "teams:write");

	const db = getDB(c.env.DB);
	const [team] = await db
		.select({ ownerId: teams.ownerId })
		.from(teams)
		.where(eq(teams.id, teamId))
		.limit(1);
	if (!team) return notFound(c, "Team");

	if (!hasScope(auth, ADMIN_SCOPE) && team.ownerId !== auth.subjectId) {
		return forbidden(c);
	}
	if (userId === team.ownerId) {
		return conflict(
			c,
			"Cannot remove the team owner from the team",
		);
	}

	const [deleted] = await db
		.delete(teamUsers)
		.where(
			and(
				eq(teamUsers.teamId, teamId),
				eq(teamUsers.userId, userId),
			),
		)
		.returning();

	if (!deleted) return notFound(c, "Team member");
	return c.body(null, 204);
});

export default {
	route,
	method: "DELETE" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Remove member from team",
	auth_required: true,
	scopes: ["teams:write"],
	scopes_any: [ADMIN_SCOPE, "teams:write"],
};
