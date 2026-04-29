/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope, hasScope } from "../../auth/helpers";
import { ADMIN_SCOPE, type AuthContext } from "../../auth/types";
import { getDB } from "../../db";
import { permissions } from "../../db/schema";
import { conflict, forbidden, notFound } from "../../lib/errors";
import { isUniqueConstraintError } from "../../lib/db-helpers";
import { parseBody, isResponse } from "../../lib/validation";
import { updatePermissionSchema } from "../../services/permissions";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/permissions/:id" as const;
type PermissionRow = typeof permissions.$inferSelect;

const canUpdatePermission = (auth: AuthContext, permission: PermissionRow) => {
	if (hasScope(auth, ADMIN_SCOPE)) return true;
	if (auth.type === "guest") return false;
	return (
		permission.subjectType === auth.subjectType &&
		permission.subjectId === auth.subjectId
	);
};

route.put(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "permissions:write");

	const id = c.req.param("id");
	const parsed = await parseBody(c, updatePermissionSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDB(c.env.DB);
	const [existing] = await db
		.select()
		.from(permissions)
		.where(eq(permissions.id, id))
		.limit(1);
	if (!existing) return notFound(c, "Permission");
	if (!canUpdatePermission(auth, existing)) return forbidden(c);

	try {
		const [row] = await db
			.update(permissions)
			.set({ ...parsed, updatedAt: new Date() })
			.where(eq(permissions.id, id))
			.returning();
		if (!row)
			throw new Error(
				`Permission disappeared during update: ${id}`,
			);
		return c.json(itemResponse(row));
	} catch (err) {
		if (isUniqueConstraintError(err))
			return conflict(c, "Conflict on update");
		throw err;
	}
});

export default {
	route,
	method: "PUT" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Update permission",
	auth_required: true,
	scopes: ["permissions:write"],
};
