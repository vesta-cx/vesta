import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { hasScope, isAuthenticated } from "../../auth/helpers";
import { getDb } from "../../db";
import { workspaces } from "../../db/schema";
import { notFound } from "../../lib/errors";
import { publicWorkspaceWhere } from "../../services/workspaces";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.get("/workspaces/:id", async (c) => {
	const id = c.req.param("id");
	const auth = c.get("auth");
	const db = getDb(c.env.DB);

	const idEq = eq(workspaces.id, id);

	if (isAuthenticated(auth) && auth.scopes.includes("admin")) {
		const [row] = await db.select().from(workspaces).where(idEq);
		if (!row) return notFound(c, "Workspace");
		return c.json(itemResponse(row));
	}

	if (isAuthenticated(auth)) {
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
	auth_required: false,
	scopes: ["workspaces:read"],
};
