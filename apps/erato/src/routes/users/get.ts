/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { ADMIN_SCOPE } from "../../auth/types";
import { hasScope, requireAuth } from "../../auth/helpers";
import { getDB } from "../../db";
import { users } from "../../db/schema";
import { forbidden, notFound } from "../../lib/errors";
import { PUBLIC_USER_FIELDS } from "../../services/users";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/users/:id" as const;

route.get(PATH, async (c) => {
	const id = c.req.param("id");
	const auth = requireAuth(c.get("auth"));
	const db = getDB(c.env.DB);
	const isAdmin = hasScope(auth, ADMIN_SCOPE);

	if (!isAdmin && !hasScope(auth, "users:read")) return forbidden(c);

	const [row] =
		isAdmin ?
			await db
				.select()
				.from(users)
				.where(eq(users.workosUserId, id))
		:	await db
				.select(PUBLIC_USER_FIELDS)
				.from(users)
				.where(eq(users.workosUserId, id));

	if (!row) return notFound(c, "User");
	return c.json(itemResponse(row));
});

export default {
	route,
	method: "GET" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Get user by ID",
	auth_required: true,
	scopes_any: [ADMIN_SCOPE, "users:read"],
};
