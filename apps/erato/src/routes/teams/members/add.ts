/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth, requireScope } from "../../../auth/helpers";
import { ADMIN_SCOPE } from "../../../auth/types";
import { getDB } from "../../../db";
import { teamUsers, teams } from "../../../db/schema";
import { expectOne, isUniqueConstraintError } from "../../../lib/db-helpers";
import { conflict, forbidden, notFound } from "../../../lib/errors";
import { parseBody, isResponse } from "../../../lib/validation";
import { addMemberSchema } from "../../../services/teams";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();
const PATH = "/teams/:teamId/members" as const;

route.post(PATH, async (c) => {
	const teamId = c.req.param("teamId");
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "teams:write");

	const parsed = await parseBody(c, addMemberSchema);
	if (isResponse(parsed)) return parsed;

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

	try {
		const rows = await db
			.insert(teamUsers)
			.values({ teamId, userId: parsed.userId })
			.returning();
		return c.json(
			itemResponse(expectOne(rows, "Team member insert")),
			201,
		);
	} catch (err) {
		if (isUniqueConstraintError(err))
			return conflict(c, "User already in team");
		throw err;
	}
});

export default {
	route,
	method: "POST" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Add member to team",
	auth_required: true,
	scopes: ["teams:write"],
	scopes_any: [ADMIN_SCOPE, "teams:write"],
};
