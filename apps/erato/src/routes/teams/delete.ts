/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { hasScope, requireAuth, requireScope } from "../../auth/helpers";
import { getDB } from "../../db";
import { teamUsers, teams } from "../../db/schema";
import { forbidden, notFound } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.delete("/teams/:id", async (c) => {
	const id = c.req.param("id");
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "teams:write");

	const db = getDB(c.env.DB);

	const [existing] = await db
		.select()
		.from(teams)
		.where(eq(teams.id, id));
	if (!existing) return notFound(c, "Team");

	const isAdmin = hasScope(auth, "admin");
	const isOwner = existing.ownerId === auth.subjectId;
	if (!isAdmin && !isOwner) return forbidden(c);

	await db.delete(teamUsers).where(eq(teamUsers.teamId, id));
	await db.delete(teams).where(eq(teams.id, id));

	return c.body(null, 204);
});

export default {
	route,
	method: "DELETE" as RouteMetadata["method"],
	path: "/teams/:id",
	description: "Delete team",
	auth_required: true,
	scopes: ["teams:write"],
};
