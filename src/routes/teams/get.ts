import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth } from "../../auth/helpers";
import { getDb } from "../../db";
import { teams } from "../../db/schema";
import { forbidden, notFound } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.get("/teams/:id", async (c) => {
	const id = c.req.param("id");
	const auth = c.get("auth");
	const apiAuth = requireAuth(auth);
	if (!hasScope(auth, "teams:read")) return forbidden(c);

	const db = getDb(c.env.DB);

	const [row] = await db
		.select()
		.from(teams)
		.where(eq(teams.id, id));
	if (!row) return notFound(c, "Team");

	const isAdmin = hasScope(auth, "admin");
	const isOwner = row.ownerId === apiAuth.userId;
	if (!isAdmin && !isOwner) return forbidden(c);

	return c.json(itemResponse(row));
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/teams/:id",
	description: "Get team by id",
	auth_required: true,
	scopes: ["teams:read"],
};
