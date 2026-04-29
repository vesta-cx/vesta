/** @format */

import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope } from "../../auth/helpers";
import { ADMIN_SCOPE } from "../../auth/types";
import { getDB } from "../../db";
import { workspaces } from "../../db/schema";
import { expectOne, isUniqueConstraintError } from "../../lib/db-helpers";
import { conflict } from "../../lib/errors";
import { parseBody, isResponse } from "../../lib/validation";
import { createWorkspaceSchema } from "../../services/workspaces";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/workspaces" as const;

route.post(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "workspaces:write");

	const parsed = await parseBody(c, createWorkspaceSchema);
	if (isResponse(parsed)) return parsed;

	try {
		const rows = await getDB(c.env.DB)
			.insert(workspaces)
			.values({
				name: parsed.name,
				slug: parsed.slug,
				description: parsed.description ?? null,
				ownerType: parsed.ownerType,
				ownerId: parsed.ownerId,
				avatarUrl: parsed.avatarUrl ?? null,
				bannerUrl: parsed.bannerUrl ?? null,
				status: parsed.status ?? "LISTED",
			})
			.returning();
		return c.json(
			itemResponse(expectOne(rows, "Workspace insert")),
			201,
		);
	} catch (err) {
		if (isUniqueConstraintError(err)) {
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
	method: "POST" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Create workspace",
	auth_required: true,
	scopes: ["workspaces:write"],
	scopes_any: [ADMIN_SCOPE, "workspaces:write"],
};
