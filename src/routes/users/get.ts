/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth } from "../../auth/helpers";
import { getDB } from "../../db";
import { users } from "../../db/schema";
import { forbidden, notFound } from "../../lib/errors";
import { PUBLIC_USER_FIELDS } from "../../services/users";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.get("/users/:id", async (c) => {
	const id = c.req.param("id");
	const auth = requireAuth(c.get("auth"));
	const db = getDB(c.env.DB);

	if (hasScope(auth, "admin")) {
		const [row] = await db
			.select()
			.from(users)
			.where(eq(users.workosUserId, id));
		if (!row) return notFound(c, "User");
		return c.json(itemResponse(row));
	}

	{
		if (!hasScope(auth, "users:read")) {
			return forbidden(c);
		}
		const [row] = await db
			.select()
			.from(users)
			.where(eq(users.workosUserId, id));
		if (!row) return notFound(c, "User");
		return c.json(itemResponse(row));
	}

	const [row] = await db
		.select(PUBLIC_USER_FIELDS)
		.from(users)
		.where(eq(users.workosUserId, id));
	if (!row) return notFound(c, "User");
	return c.json(itemResponse(row));
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/users/:id",
	description: "Get user by ID",
	auth_required: true,
	scopes: ["users:read"],
};
