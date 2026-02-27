import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireScope } from "../../auth/helpers";
import { getDb } from "../../db";
import { workspaces } from "../../db/schema";
import { conflict } from "../../lib/errors";
import { parseBody, isResponse } from "../../lib/validation";
import { createWorkspaceSchema } from "../../services/workspaces";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.post("/workspaces", async (c) => {
	const auth = c.get("auth");
	requireScope(auth, "workspaces:write");

	const parsed = await parseBody(c, createWorkspaceSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDb(c.env.DB);

	const visibility = parsed.visibility ?? "public";
	const validVisibility = visibility === "unlisted" ? "public" : visibility;

	try {
		const [row] = await db
			.insert(workspaces)
			.values({
				name: parsed.name,
				slug: parsed.slug,
				description: parsed.description ?? null,
				ownerType: parsed.ownerType as "user" | "organization",
				ownerId: parsed.ownerId,
				avatarUrl: parsed.avatarUrl ?? null,
				bannerUrl: parsed.bannerUrl ?? null,
				visibility: validVisibility as "public" | "private",
			})
			.returning();
		return c.json(itemResponse(row!), 201);
	} catch (err) {
		if (err instanceof Error && err.message.includes("UNIQUE")) {
			return conflict(c, "Workspace with this slug already exists", "slug");
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
