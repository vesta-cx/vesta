import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { hasScope, requireAuth } from "../../../auth/helpers";
import { getDb } from "../../../db";
import { teamUsers, teams } from "../../../db/schema";
import { forbidden, notFound } from "../../../lib/errors";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();

route.get("/teams/:teamId/members", async (c) => {
	const teamId = c.req.param("teamId");
	const auth = c.get("auth");
	const apiAuth = requireAuth(auth);
	if (!hasScope(auth, "teams:read")) return forbidden(c);

	const db = getDb(c.env.DB);

	const [team] = await db
		.select()
		.from(teams)
		.where(eq(teams.id, teamId));
	if (!team) return notFound(c, "Team");

	const isAdmin = hasScope(auth, "admin");
	const isOwner = team.ownerId === apiAuth.userId;
	const [membership] = await db
		.select()
		.from(teamUsers)
		.where(and(eq(teamUsers.teamId, teamId), eq(teamUsers.userId, apiAuth.userId)));
	const isMember = !!membership;

	if (!isAdmin && !isOwner && !isMember) return forbidden(c);

	const rows = await db
		.select()
		.from(teamUsers)
		.where(eq(teamUsers.teamId, teamId));

	return c.json({ data: rows });
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/teams/:teamId/members",
	description: "List team members",
	auth_required: true,
	scopes: ["teams:read"],
};
