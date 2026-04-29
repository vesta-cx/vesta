/** @format */

import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { ADMIN_SCOPE } from "../../auth/types";
import { requireAuth, requireScope } from "../../auth/helpers";
import { getDB } from "../../db";
import { users } from "../../db/schema";
import { conflict } from "../../lib/errors";
import { expectOne, isUniqueConstraintError } from "../../lib/db-helpers";
import { parseBody, isResponse } from "../../lib/validation";
import { createUserSchema } from "../../services/users";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/users" as const;

route.post(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, ADMIN_SCOPE);

	const parsed = await parseBody(c, createUserSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDB(c.env.DB);
	try {
		const rows = await db.insert(users).values(parsed).returning();
		return c.json(
			itemResponse(expectOne(rows, "User insert")),
			201,
		);
	} catch (err) {
		if (isUniqueConstraintError(err)) {
			return conflict(c, "User already exists");
		}
		throw err;
	}
});

export default {
	route,
	method: "POST" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Create user (admin only)",
	auth_required: true,
	scopes: [ADMIN_SCOPE],
};
