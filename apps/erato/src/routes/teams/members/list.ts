/** @format */

import { and, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { parseListQuery, listResponse } from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth, requireScope } from "../../../auth/helpers";
import { ADMIN_SCOPE } from "../../../auth/types";
import { getDB } from "../../../db";
import { teamUsers, teams } from "../../../db/schema";
import { forbidden, notFound } from "../../../lib/errors";
import { teamMemberListConfig } from "../../../services/teams";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();
const PATH = "/teams/:teamId/members" as const;
const countAll = sql<string | number>`count(*)`;

route.get(PATH, async (c) => {
	const teamId = c.req.param("teamId");
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "teams:read");

	const db = getDB(c.env.DB);
	const [team] = await db
		.select({ ownerId: teams.ownerId })
		.from(teams)
		.where(eq(teams.id, teamId))
		.limit(1);
	if (!team) return notFound(c, "Team");

	const isAdmin = hasScope(auth, ADMIN_SCOPE);
	const isOwner = team.ownerId === auth.subjectId;
	let isMember = false;
	if (!isAdmin && !isOwner) {
		const [membership] = await db
			.select({ userId: teamUsers.userId })
			.from(teamUsers)
			.where(
				and(
					eq(teamUsers.teamId, teamId),
					eq(teamUsers.userId, auth.subjectId),
				),
			)
			.limit(1);
		isMember = Boolean(membership);
	}

	if (!isAdmin && !isOwner && !isMember) return forbidden(c);

	const query = parseListQuery(
		new URLSearchParams(c.req.query() as Record<string, string>),
		teamMemberListConfig,
	);
	const authWhere = eq(teamUsers.teamId, teamId);
	const whereClause =
		query.where ? and(authWhere, query.where) : authWhere;
	const [rows, countResult] = await Promise.all([
		db
			.select()
			.from(teamUsers)
			.where(whereClause)
			.orderBy(query.orderBy)
			.limit(query.limit)
			.offset(query.offset),
		db
			.select({ total: countAll })
			.from(teamUsers)
			.where(whereClause),
	]);

	return c.json(
		listResponse(
			rows,
			Number(countResult[0]?.total ?? 0),
			query.limit,
			query.offset,
		),
	);
});

export default {
	route,
	method: "GET" satisfies RouteMetadata["method"],
	path: PATH,
	description: "List team members",
	auth_required: true,
	scopes: ["teams:read"],
	scopes_any: [ADMIN_SCOPE, "teams:read"],
};
