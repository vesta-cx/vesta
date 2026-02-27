/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { runListQuery } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope } from "../../auth/helpers";
import { getDB } from "../../db";
import { permissions } from "../../db/schema";
import { permissionListConfig } from "../../services/permissions";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.get("/permissions", async (c) => {
	const auth = c.get("auth");
	requireScope(auth, "permissions:read");
	const apiAuth = requireAuth(auth);

	const isAdmin = apiAuth.scopes.includes("admin");

	const envelope = await runListQuery({
		db: getDB(c.env.DB),
		table: permissions,
		input: new URL(c.req.url).searchParams,
		config: permissionListConfig,
		baseWhere:
			isAdmin ? undefined : (
				eq(permissions.subjectId, apiAuth.subjectId)
			),
		mode: "envelope",
	});
	return c.json(envelope);
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/permissions",
	description: "List permissions",
	auth_required: true,
	scopes: ["permissions:read"],
};
