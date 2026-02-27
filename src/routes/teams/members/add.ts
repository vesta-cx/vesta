import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth, requireScope } from "../../../auth/helpers";
import { getDb } from "../../../db";
import { teamUsers, teams } from "../../../db/schema";
import { conflict, forbidden, notFound } from "../../../lib/errors";
import { parseBody, isResponse, z } from "../../../lib/validation";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const addMemberSchema = z.object({
	userId: z.string().min(1),
});

const route = new Hono<AppEnv>();

route.post("/teams/:teamId/members", async (c) => {
	const teamId = c.req.param("teamId");
	const auth = c.get("auth");
	const apiAuth = requireAuth(auth);
	requireScope(auth, "teams:write");

	const parsed = await parseBody(c, addMemberSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDb(c.env.DB);

	const [team] = await db
		.select()
		.from(teams)
		.where(eq(teams.id, teamId));
	if (!team) return notFound(c, "Team");

	const isAdmin = hasScope(auth, "admin");
	const isOwner = team.ownerId === apiAuth.userId;
	if (!isAdmin && !isOwner) return forbidden(c);

	try {
		const [row] = await db
			.insert(teamUsers)
			.values({ teamId, userId: parsed.userId })
			.returning();
		return c.json(itemResponse(row!), 201);
	} catch (err) {
		if (err instanceof Error && /UNIQUE/i.test(err.message)) {
			return conflict(c, "User already in team");
		}
		throw err;
	}
});

export default {
	route,
	method: "POST" as RouteMetadata["method"],
	path: "/teams/:teamId/members",
	description: "Add member to team",
	auth_required: true,
	scopes: ["teams:write"],
};
