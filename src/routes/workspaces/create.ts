/** @format */

import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope } from "../../auth/helpers";
import { getDB } from "../../db";
import { workspaces } from "../../db/schema";
import { conflict } from "../../lib/errors";
import { parseBody, isResponse } from "../../lib/validation";
import { createWorkspaceSchema } from "../../services/workspaces";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.post("/workspaces", async (c) => {
	const auth = requireAuth(c.get("auth"));

	requireScope(auth, "workspaces:write");

	const parsed = await parseBody(c, createWorkspaceSchema);
	if (isResponse(parsed)) return parsed;
	const input = parsed as any;

	const db = getDB(c.env.DB);

	try {
		const [row] = await db
			.insert(workspaces)
			.values({
				name: input.name,
				slug: input.slug,
				description: input.description ?? null,
				ownerType: input.ownerType as
					| "user"
					| "organization",
				ownerId: input.ownerId,
				avatarUrl: input.avatarUrl ?? null,
				bannerUrl: input.bannerUrl ?? null,
				visibility: (input.visibility ?? "public") as
					| "public"
					| "private",
			})
			.returning();
		return c.json(itemResponse(row!), 201);
	} catch (err) {
		if (err instanceof Error && err.message.includes("UNIQUE")) {
			return conflict(
				c,
				"Workspace with this slug already exists",
				"slug",
			);
		}
		throw err;
	}
});

export default {
	route,
	method: "POST" as RouteMetadata["method"],
	path: "/workspaces",
	description: "Create workspace",
	auth_required: true,
	scopes: ["workspaces:write"],
};
