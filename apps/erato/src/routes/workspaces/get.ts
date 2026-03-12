/** @format */

import { and, eq, exists, or, sql } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth } from "../../auth/helpers";
import { getDB } from "../../db";
import {
	WORKSPACE_PERMISSION_ACTIONS,
	permissions,
	workspaces,
} from "../../db/schema";
import { forbidden, notFound } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.get("/workspaces/:id", async (c) => {
	const auth = requireAuth(c.get("auth"));
	const db = getDB(c.env.DB);
	const id = c.req.param("id");

	if (hasScope(auth, "admin")) {
		const [row] = await db
			.select()
			.from(workspaces)
			.where(eq(workspaces.id, id))
			.limit(1);
		return row ?
				c.json(itemResponse(row))
			:	notFound(c, "Workspace");
	}

	if (!hasScope(auth, "workspaces:read")) return forbidden(c);

	const ownerWhere =
		auth.subjectType === "user" || auth.subjectType === "organization" ?
			and(
				eq(workspaces.ownerType, auth.subjectType),
				eq(workspaces.ownerId, auth.subjectId),
			)
		:	undefined;

	const permissionSubjectType =
		auth.subjectType === "user" || auth.subjectType === "organization" ?
			auth.subjectType
		:	undefined;
	const explicitAllowWhere =
		permissionSubjectType ?
			exists(
				db
					.select({ id: permissions.id })
					.from(permissions)
					.where(
						and(
							eq(
								permissions.subjectType,
								permissionSubjectType,
							),
							eq(permissions.subjectId, auth.subjectId),
							eq(permissions.objectType, "workspace"),
							eq(permissions.objectId, id),
							eq(
								permissions.action,
								WORKSPACE_PERMISSION_ACTIONS[0],
							),
							eq(permissions.value, "allow"),
						),
					),
			)
		:	sql`0`;

	const accessWhere =
		ownerWhere ?
			or(eq(workspaces.status, "LISTED"), explicitAllowWhere, ownerWhere)
		:	or(eq(workspaces.status, "LISTED"), explicitAllowWhere);

	const [row] = await db
		.select()
		.from(workspaces)
		.where(and(eq(workspaces.id, id), accessWhere))
		.limit(1);
	return row ? c.json(itemResponse(row)) : notFound(c, "Workspace");
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/workspaces/:id",
	description: "Get workspace by id",
	auth_required: true,
	scopes: ["workspaces:read"],
};
