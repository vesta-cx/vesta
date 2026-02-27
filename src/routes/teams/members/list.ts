/** @format */

import { and, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import {
	parseListQuery,
	listResponse,
	type ListQueryConfig,
} from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth } from "../../../auth/helpers";
import { getDB } from "../../../db";
import { teamUsers, teams } from "../../../db/schema";
import { forbidden, notFound } from "../../../lib/errors";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();

const teamMemberListConfig: ListQueryConfig = {
	filters: {
		user_id: { column: teamUsers.userId },
	},
	sortable: {
		user_id: teamUsers.userId,
	},
	defaultSort: { key: "user_id", dir: "asc" },
};

route.get("/teams/:teamId/members", async (c) => {
	const teamId = c.req.param("teamId");
	const auth = requireAuth(c.get("auth"));
	if (!hasScope(auth, "teams:read")) return forbidden(c);

	const db = getDB(c.env.DB);

	const [team] = await db
		.select()
		.from(teams)
		.where(eq(teams.id, teamId));
	if (!team) return notFound(c, "Team");

	const isAdmin = hasScope(auth, "admin");
	const isOwner = team.ownerId === auth.subjectId;
	const [membership] = await db
		.select()
		.from(teamUsers)
		.where(
			and(
				eq(teamUsers.teamId, teamId),
				eq(teamUsers.userId, auth.subjectId),
			),
		);
	const isMember = !!membership;

	if (!isAdmin && !isOwner && !isMember) return forbidden(c);

	const query = parseListQuery(
		new URL(c.req.url).searchParams,
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
			.select({ total: sql<number>`count(*)` })
			.from(teamUsers)
			.where(whereClause),
	]);

	return c.json(
		listResponse(
			rows,
			countResult[0]?.total ?? 0,
			query.limit,
			query.offset,
		),
	);
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/teams/:teamId/members",
	description: "List team members",
	auth_required: true,
	scopes: ["teams:read"],
};
