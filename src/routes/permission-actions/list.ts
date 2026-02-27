/** @format */

import { Hono } from "hono";
import { runListQuery } from "@mia-cx/drizzle-query-factory";
import { requireScope } from "../../auth/helpers";
import { getDB } from "../../db";
import { permissionActions } from "../../db/schema";
import { permissionActionListConfig } from "../../services/permissions";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.get("/permission-actions", async (c) => {
	const auth = c.get("auth");
	requireScope(auth, "permissions:read");

	const envelope = await runListQuery({
		db: getDB(c.env.DB),
		table: permissionActions,
		input: new URL(c.req.url).searchParams,
		config: permissionActionListConfig,
		mode: "envelope",
	});
	return c.json(envelope);
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/permission-actions",
	description: "List permission actions",
	auth_required: true,
	scopes: ["permissions:read"],
};
