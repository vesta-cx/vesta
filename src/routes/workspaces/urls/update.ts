/** @format */

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope } from "../../../auth/helpers";
import { getDB } from "../../../db";
import { externalLinks } from "../../../db/schema";
import { notFound } from "../../../lib/errors";
import { parseBody, isResponse } from "../../../lib/validation";
import { updateExternalLinkSchema } from "../../links/shared";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();

route.put("/workspaces/:workspaceId/urls/:position", async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "workspaces:write");

	const parsed = await parseBody(c, updateExternalLinkSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDB(c.env.DB);
	const workspaceId = c.req.param("workspaceId");
	const position = parseInt(c.req.param("position"), 10);

	const [row] = await db
		.update(externalLinks)
		.set({ ...parsed, updatedAt: new Date() })
		.where(
			and(
				eq(externalLinks.subjectType, "workspace"),
				eq(externalLinks.subjectId, workspaceId),
				eq(externalLinks.position, position),
			),
		)
		.returning();

	return row ? c.json(itemResponse(row)) : notFound(c, "Workspace URL");
});

export default {
	route,
	method: "PUT" as RouteMetadata["method"],
	path: "/workspaces/:workspaceId/urls/:position",
	description: "Update workspace URL",
	auth_required: true,
	scopes: ["workspaces:write"],
};
