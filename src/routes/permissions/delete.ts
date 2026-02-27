import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { requireAuth, requireScope } from "../../auth/helpers";
import { getDb } from "../../db";
import { permissions } from "../../db/schema";
import { forbidden, notFound } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.delete("/permissions/:id", async (c) => {
	const auth = c.get("auth");
	requireScope(auth, "permissions:write");
	const apiAuth = requireAuth(auth);

	const id = c.req.param("id");
	const db = getDb(c.env.DB);

	const [existing] = await db
		.select()
		.from(permissions)
		.where(eq(permissions.id, id))
		.limit(1);
	if (!existing) return notFound(c, "Permission");

	const isAdmin = apiAuth.scopes.includes("admin");
	const isSubject = existing.subjectId === apiAuth.userId;
	if (!isAdmin && !isSubject) return forbidden(c);

	const [row] = await db
		.delete(permissions)
		.where(eq(permissions.id, id))
		.returning();
	if (!row) return notFound(c, "Permission");

	return c.body(null, 204);
});

export default {
	route,
	method: "DELETE" as RouteMetadata["method"],
	path: "/permissions/:id",
	description: "Delete permission",
	auth_required: true,
	scopes: ["permissions:write"],
};
