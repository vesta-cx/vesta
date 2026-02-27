/** @format */

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth } from "../../auth/helpers";
import { getDB } from "../../db";
import { workspaces } from "../../db/schema";
import { notFound } from "../../lib/errors";
import { publicWorkspaceWhere } from "../../services/workspaces";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.get("/workspaces/:id", async (c) => {
	const id = c.req.param("id");
	const auth = requireAuth(c.get("auth"));
	const db = getDB(c.env.DB);

	const idEq = eq(workspaces.id, id);

	if (hasScope(auth, "admin")) {
		const [row] = await db.select().from(workspaces).where(idEq);
		if (!row) return notFound(c, "Workspace");
		return c.json(itemResponse(row));
	}

	{
		if (!hasScope(auth, "workspaces:read")) {
			const [row] = await db
				.select()
				.from(workspaces)
				.where(and(idEq, publicWorkspaceWhere()));
			if (!row) return notFound(c, "Workspace");
			return c.json(itemResponse(row));
		}
		const [row] = await db.select().from(workspaces).where(idEq);
		if (!row) return notFound(c, "Workspace");
		return c.json(itemResponse(row));
	}

	const [row] = await db
		.select()
		.from(workspaces)
		.where(and(idEq, publicWorkspaceWhere()));
	if (!row) return notFound(c, "Workspace");
	return c.json(itemResponse(row));
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/workspaces/:id",
	description: "Get workspace by id",
	auth_required: true,
	scopes: ["workspaces:read"],
};
