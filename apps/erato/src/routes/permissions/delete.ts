/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { requireAuth, requireScope, hasScope } from "../../auth/helpers";
import { ADMIN_SCOPE } from "../../auth/types";
import { getDB } from "../../db";
import { permissions } from "../../db/schema";
import { forbidden, notFound } from "../../lib/errors";
import type { AuthContext } from "../../auth/types";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/permissions/:id" as const;

type PermissionRow = typeof permissions.$inferSelect;

const canDeletePermission = (auth: AuthContext, permission: PermissionRow) => {
	if (hasScope(auth, ADMIN_SCOPE)) return true;
	if (auth.type === "guest") return false;
	return (
		permission.subjectType === auth.subjectType &&
		permission.subjectId === auth.subjectId
	);
};

route.delete(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "permissions:write");

	const id = c.req.param("id");
	const db = getDB(c.env.DB);

	const [existing] = await db
		.select()
		.from(permissions)
		.where(eq(permissions.id, id))
		.limit(1);
	if (!existing) return notFound(c, "Permission");
	if (!canDeletePermission(auth, existing)) return forbidden(c);

	const [row] = await db
		.delete(permissions)
		.where(eq(permissions.id, id))
		.returning();
	if (!row) return notFound(c, "Permission");

	return c.body(null, 204);
});

export default {
	route,
	method: "DELETE" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Delete permission",
	auth_required: true,
	scopes: ["permissions:write"],
};
