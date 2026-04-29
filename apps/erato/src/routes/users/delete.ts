/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { ADMIN_SCOPE } from "../../auth/types";
import { requireAuth, requireScope } from "../../auth/helpers";
import { getDB } from "../../db";
import { users } from "../../db/schema";
import { forbidden, notFound } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/users/:id" as const;
const WORKOS_USER_ID_PATTERN = /^user_[a-zA-Z0-9_]+$/;

route.delete(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, ADMIN_SCOPE);

	const id = c.req.param("id");
	if (!WORKOS_USER_ID_PATTERN.test(id)) return notFound(c, "User");
	if (id === auth.subjectId) {
		return forbidden(c, "Cannot delete your own account");
	}

	const db = getDB(c.env.DB);
	const [row] = await db
		.delete(users)
		.where(eq(users.workosUserId, id))
		.returning();

	if (!row) return notFound(c, "User");
	return c.body(null, 204);
});

export default {
	route,
	method: "DELETE" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Delete user (admin only)",
	auth_required: true,
	scopes: [ADMIN_SCOPE],
};
