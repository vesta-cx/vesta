/** @format */

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { requireAuth, requireScope } from "../../../auth/helpers";
import { getDB } from "../../../db";
import { externalLinks } from "../../../db/schema";
import { notFound } from "../../../lib/errors";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();

route.delete("/workspaces/:workspaceId/urls/:position", async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "workspaces:write");

	const db = getDB(c.env.DB);
	const workspaceId = c.req.param("workspaceId");
	const position = parseInt(c.req.param("position"), 10);

	const [row] = await db
		.delete(externalLinks)
		.where(
			and(
				eq(externalLinks.subjectType, "workspace"),
				eq(externalLinks.subjectId, workspaceId),
				eq(externalLinks.position, position),
			),
		)
		.returning();

	if (!row) return notFound(c, "Workspace URL");
	return c.body(null, 204);
});

export default {
	route,
	method: "DELETE" as RouteMetadata["method"],
	path: "/workspaces/:workspaceId/urls/:position",
	description: "Remove workspace URL",
	auth_required: true,
	scopes: ["workspaces:write"],
};
