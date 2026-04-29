/** @format */

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { runListQuery } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope, hasScope } from "../../auth/helpers";
import { ADMIN_SCOPE } from "../../auth/types";
import { getDB } from "../../db";
import { permissions } from "../../db/schema";
import { forbidden } from "../../lib/errors";
import { permissionListConfig } from "../../services/permissions";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/permissions" as const;

route.get(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "permissions:read");

	const isAdmin = hasScope(auth, ADMIN_SCOPE);
	if (
		!isAdmin &&
		auth.subjectType !== "user" &&
		auth.subjectType !== "organization"
	) {
		return forbidden(c);
	}

	const envelope = await runListQuery({
		db: getDB(c.env.DB),
		table: permissions,
		input: new URLSearchParams(
			c.req.query() as Record<string, string>,
		),
		config: permissionListConfig,
		baseWhere:
			isAdmin ? undefined : (
				and(
					eq(
						permissions.subjectType,
						auth.subjectType,
					),
					eq(
						permissions.subjectId,
						auth.subjectId,
					),
				)
			),
		mode: "envelope",
	});
	return c.json(envelope);
});

export default {
	route,
	method: "GET" satisfies RouteMetadata["method"],
	path: PATH,
	description: "List permissions",
	auth_required: true,
	scopes: ["permissions:read"],
};
