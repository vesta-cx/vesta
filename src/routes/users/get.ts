import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { hasScope, isAuthenticated } from "../../auth/helpers";
import { getDb } from "../../db";
import { users } from "../../db/schema";
import { forbidden, notFound } from "../../lib/errors";
import { PUBLIC_USER_FIELDS } from "../../services/users";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.get("/users/:id", async (c) => {
	const id = c.req.param("id");
	const auth = c.get("auth");
	const db = getDb(c.env.DB);

	if (isAuthenticated(auth) && auth.scopes.includes("admin")) {
		const [row] = await db
			.select()
			.from(users)
			.where(eq(users.workosUserId, id));
		if (!row) return notFound(c, "User");
		return c.json(itemResponse(row));
	}

	if (isAuthenticated(auth)) {
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
	auth_required: false,
	scopes: ["users:read"],
};
