/** @format */

import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth } from "../../auth/helpers";
import { getDB } from "../../db";
import { users } from "../../db/schema";
import { conflict, forbidden } from "../../lib/errors";
import { parseBody, isResponse } from "../../lib/validation";
import { createUserSchema } from "../../services/users";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.post("/users", async (c) => {
	const auth = requireAuth(c.get("auth"));
	if (!auth.scopes.includes("admin")) {
		return forbidden(c, "Forbidden: admin scope required");
	}

	const parsed = await parseBody(c, createUserSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDB(c.env.DB);
	try {
		const [row] = await db.insert(users).values(parsed).returning();
		return c.json(itemResponse(row!), 201);
	} catch (err) {
		const msg = err instanceof Error ? err.message : "";
		if (/UNIQUE|unique constraint/i.test(msg)) {
			return conflict(
				c,
				"User already exists",
				"workosUserId",
			);
		}
		throw err;
	}
});

export default {
	route,
	method: "POST" as RouteMetadata["method"],
	path: "/users",
	description: "Create user (admin only)",
	auth_required: true,
	scopes: ["admin"],
};
