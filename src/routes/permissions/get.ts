/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope } from "../../auth/helpers";
import { getDB } from "../../db";
import { permissions } from "../../db/schema";
import { forbidden, notFound } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.get("/permissions/:id", async (c) => {
	const auth = c.get("auth");
	requireScope(auth, "permissions:read");
	const apiAuth = requireAuth(auth);

	const id = c.req.param("id");
	const db = getDB(c.env.DB);

	const [row] = await db
		.select()
		.from(permissions)
		.where(eq(permissions.id, id))
		.limit(1);
	if (!row) return notFound(c, "Permission");

	const isAdmin = apiAuth.scopes.includes("admin");
	const isSubject = row.subjectId === apiAuth.subjectId;
	if (!isAdmin && !isSubject) return forbidden(c);

	return c.json(itemResponse(row));
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/permissions/:id",
	description: "Get permission by id",
	auth_required: true,
	scopes: ["permissions:read"],
};
