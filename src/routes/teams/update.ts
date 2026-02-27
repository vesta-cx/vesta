/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth, requireScope } from "../../auth/helpers";
import { getDB } from "../../db";
import { teams } from "../../db/schema";
import { conflict, forbidden, notFound } from "../../lib/errors";
import { parseBody, isResponse } from "../../lib/validation";
import { updateTeamSchema } from "../../services/teams";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.put("/teams/:id", async (c) => {
	const id = c.req.param("id");
	const auth = c.get("auth");
	const apiAuth = requireAuth(auth);
	requireScope(auth, "teams:write");

	const parsed = await parseBody(c, updateTeamSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDB(c.env.DB);

	const [existing] = await db
		.select()
		.from(teams)
		.where(eq(teams.id, id));
	if (!existing) return notFound(c, "Team");

	const isAdmin = hasScope(auth, "admin");
	const isOwner = existing.ownerId === apiAuth.subjectId;
	if (!isAdmin && !isOwner) return forbidden(c);

	const data: Record<string, unknown> = {
		updatedAt: new Date(),
	};
	if (parsed.name !== undefined) data.name = parsed.name;

	try {
		const [row] = await db
			.update(teams)
			.set(data)
			.where(eq(teams.id, id))
			.returning();
		return c.json(itemResponse(row!));
	} catch (err) {
		if (err instanceof Error && err.message.includes("UNIQUE")) {
			return conflict(c, "Team update conflict");
		}
		throw err;
	}
});

export default {
	route,
	method: "PUT" as RouteMetadata["method"],
	path: "/teams/:id",
	description: "Update team",
	auth_required: true,
	scopes: ["teams:write"],
};
