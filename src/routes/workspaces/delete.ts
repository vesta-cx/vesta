import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { hasScope, requireAuth, requireScope } from "../../auth/helpers";
import { getDb } from "../../db";
import { workspaces } from "../../db/schema";
import { forbidden, notFound } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.delete("/workspaces/:id", async (c) => {
	const id = c.req.param("id");
	const auth = c.get("auth");
	const apiAuth = requireAuth(auth);
	requireScope(auth, "workspaces:write");

	const db = getDb(c.env.DB);

	const [existing] = await db
		.select()
		.from(workspaces)
		.where(eq(workspaces.id, id));
	if (!existing) return notFound(c, "Workspace");

	const isAdmin = hasScope(auth, "admin");
	const isOwner = existing.ownerId === apiAuth.userId;
	if (!isAdmin && !isOwner) return forbidden(c);

	await db.delete(workspaces).where(eq(workspaces.id, id));
	return c.body(null, 204);
});

export default {
	route,
	method: "DELETE" as RouteMetadata["method"],
	path: "/workspaces/:id",
	description: "Delete workspace",
	auth_required: true,
	scopes: ["workspaces:write"],
};
