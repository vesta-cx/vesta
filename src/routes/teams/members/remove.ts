/** @format */

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { hasScope, requireAuth, requireScope } from "../../../auth/helpers";
import { getDB } from "../../../db";
import { teamUsers, teams } from "../../../db/schema";
import { forbidden, notFound } from "../../../lib/errors";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();

route.delete("/teams/:teamId/members/:userId", async (c) => {
	const { teamId, userId } = c.req.param();
	const auth = c.get("auth");
	const apiAuth = requireAuth(auth);
	requireScope(auth, "teams:write");

	const db = getDB(c.env.DB);

	const [team] = await db
		.select()
		.from(teams)
		.where(eq(teams.id, teamId));
	if (!team) return notFound(c, "Team");

	const isAdmin = hasScope(auth, "admin");
	const isOwner = team.ownerId === apiAuth.subjectId;
	if (!isAdmin && !isOwner) return forbidden(c);

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
	method: "DELETE" as RouteMetadata["method"],
	path: "/teams/:teamId/members/:userId",
	description: "Remove member from team",
	auth_required: true,
	scopes: ["teams:write"],
};
