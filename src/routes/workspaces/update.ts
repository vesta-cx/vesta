import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth, requireScope } from "../../auth/helpers";
import { getDb } from "../../db";
import { workspaces } from "../../db/schema";
import { conflict, forbidden, notFound } from "../../lib/errors";
import { parseBody, isResponse } from "../../lib/validation";
import { updateWorkspaceSchema } from "../../services/workspaces";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.put("/workspaces/:id", async (c) => {
	const id = c.req.param("id");
	const auth = c.get("auth");
	const apiAuth = requireAuth(auth);
	requireScope(auth, "workspaces:write");

	const parsed = await parseBody(c, updateWorkspaceSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDb(c.env.DB);

	const [existing] = await db
		.select()
		.from(workspaces)
		.where(eq(workspaces.id, id));
	if (!existing) return notFound(c, "Workspace");

	const isAdmin = hasScope(auth, "admin");
	const isOwner = existing.ownerId === apiAuth.userId;
	if (!isAdmin && !isOwner) return forbidden(c);

	const data: Record<string, unknown> = {
		updatedAt: new Date(),
	};
	if (parsed.name !== undefined) data.name = parsed.name;
	if (parsed.slug !== undefined) data.slug = parsed.slug;
	if (parsed.description !== undefined) data.description = parsed.description;
	if (parsed.avatarUrl !== undefined) data.avatarUrl = parsed.avatarUrl;
	if (parsed.bannerUrl !== undefined) data.bannerUrl = parsed.bannerUrl;
	if (parsed.visibility !== undefined) data.visibility = parsed.visibility;

	try {
		const [row] = await db
			.update(workspaces)
			.set(data)
			.where(eq(workspaces.id, id))
			.returning();
		return c.json(itemResponse(row!));
	} catch (err) {
		if (err instanceof Error && err.message.includes("UNIQUE")) {
			return conflict(c, "Workspace with this slug already exists", "slug");
		}
		throw err;
	}
});

export default {
	route,
	method: "PUT" as RouteMetadata["method"],
	path: "/workspaces/:id",
	description: "Update workspace",
	auth_required: true,
	scopes: ["workspaces:write"],
};
