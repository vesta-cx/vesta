import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope } from "../../auth/helpers";
import { getDb } from "../../db";
import { permissions } from "../../db/schema";
import { conflict, forbidden, notFound } from "../../lib/errors";
import { parseBody, isResponse } from "../../lib/validation";
import { updatePermissionSchema } from "../../services/permissions";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.put("/permissions/:id", async (c) => {
	const auth = c.get("auth");
	requireScope(auth, "permissions:write");
	const apiAuth = requireAuth(auth);

	const id = c.req.param("id");
	const parsed = await parseBody(c, updatePermissionSchema);
	if (isResponse(parsed)) return parsed;

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

	try {
		const [row] = await db
			.update(permissions)
			.set({ ...parsed, updatedAt: new Date() })
			.where(eq(permissions.id, id))
			.returning();
		return row ? c.json(itemResponse(row)) : notFound(c, "Permission");
	} catch (err) {
		if (err instanceof Error && /UNIQUE/i.test(err.message)) {
			return conflict(c, "Conflict on update");
		}
		throw err;
	}
});

export default {
	route,
	method: "PUT" as RouteMetadata["method"],
	path: "/permissions/:id",
	description: "Update permission",
	auth_required: true,
	scopes: ["permissions:write"],
};
