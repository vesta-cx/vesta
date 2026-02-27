/** @format */

import { and, eq, exists, or, sql } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth } from "../../auth/helpers";
import { getDB } from "../../db";
import {
	RESOURCE_PERMISSION_ACTIONS,
	permissions,
	resources,
} from "../../db/schema";
import { forbidden, notFound } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.get("/resources/:id", async (c) => {
	const auth = requireAuth(c.get("auth"));
	const db = getDB(c.env.DB);
	const id = c.req.param("id");

	if (hasScope(auth, "admin")) {
		const [row] = await db
			.select()
			.from(resources)
			.where(eq(resources.id, id))
			.limit(1);
		return row ?
				c.json(itemResponse(row))
			:	notFound(c, "Resource");
	}

	if (!hasScope(auth, "resources:read")) return forbidden(c);

	const ownerWhere =
		auth.subjectType === "user" || auth.subjectType === "organization" ?
			and(
				eq(resources.ownerType, auth.subjectType),
				eq(resources.ownerId, auth.subjectId),
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
							eq(permissions.objectType, "resource"),
							eq(permissions.objectId, id),
							eq(
								permissions.action,
								RESOURCE_PERMISSION_ACTIONS[0],
							),
							eq(permissions.value, "allow"),
						),
					),
			)
		:	sql`0`;

	const accessWhere =
		ownerWhere ?
			or(eq(resources.status, "LISTED"), explicitAllowWhere, ownerWhere)
		:	or(eq(resources.status, "LISTED"), explicitAllowWhere);

	const [row] = await db
		.select()
		.from(resources)
		.where(and(eq(resources.id, id), accessWhere))
		.limit(1);
	return row ? c.json(itemResponse(row)) : notFound(c, "Resource");
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/resources/:id",
	description: "Get resource by ID",
	auth_required: true,
	scopes: ["resources:read"],
};
