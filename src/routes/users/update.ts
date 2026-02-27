/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth } from "../../auth/helpers";
import { getDB } from "../../db";
import { users } from "../../db/schema";
import { forbidden, notFound } from "../../lib/errors";
import { parseBody, isResponse } from "../../lib/validation";
import { updateUserSchema } from "../../services/users";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.put("/users/:id", async (c) => {
	const id = c.req.param("id");
	const auth = requireAuth(c.get("auth"));

	const isSelf = auth.subjectId === id;
	const isAdmin = auth.scopes.includes("admin");

	if (!isSelf && !isAdmin) {
		return forbidden(c);
	}

	if (!isAdmin) {
		const hasWrite = auth.scopes.includes("users:write");
		if (!hasWrite) return forbidden(c);
	}

	const parsed = await parseBody(c, updateUserSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDB(c.env.DB);
	const [row] = await db
		.update(users)
		.set({ ...parsed, updatedAt: new Date() })
		.where(eq(users.workosUserId, id))
		.returning();

	if (!row) return notFound(c, "User");
	return c.json(itemResponse(row));
});

export default {
	route,
	method: "PUT" as RouteMetadata["method"],
	path: "/users/:id",
	description: "Update user",
	auth_required: true,
	scopes: ["users:write"],
};
