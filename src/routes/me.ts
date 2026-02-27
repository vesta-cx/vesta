/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth } from "../auth/helpers";
import { getDB } from "../db";
import { users, workspaces, organizations } from "../db/schema";
import { workos, type WorkOSUser } from "../services/workos";
import { mergeOrgResponse } from "../services/organizations";
import { notFound } from "../lib/errors";
import type { AppEnv } from "../env";
import type { RouteMetadata } from "../registry";

const mergeUserResponse = (
	workosUser: WorkOSUser,
	extension?: typeof users.$inferSelect | null,
) => ({
	id: workosUser.id,
	email: workosUser.email,
	firstName: workosUser.first_name,
	lastName: workosUser.last_name,
	organizationId: workosUser.organization_id,
	displayName: extension?.displayName ?? null,
	avatarUrl: extension?.avatarUrl ?? null,
	bio: extension?.bio ?? null,
	themeConfig: extension?.themeConfig ?? null,
	createdAt: extension?.createdAt ?? workosUser.created_at,
	updatedAt: extension?.updatedAt ?? workosUser.updated_at,
});

const route = new Hono<AppEnv>();

route.get("/me", async (c) => {
	const auth = c.get("auth");
	const apiAuth = requireAuth(auth);

	const { subjectType, subjectId } = apiAuth;
	const db = getDB(c.env.DB);

	if (subjectType === "user") {
		let workosUser;
		try {
			workosUser = await workos.users.get(
				c.env.WORKOS_API_KEY,
				subjectId,
			);
		} catch {
			return notFound(c, "User");
		}
		const [extension] = await db
			.select()
			.from(users)
			.where(eq(users.workosUserId, subjectId))
			.limit(1);
		return c.json(
			itemResponse(mergeUserResponse(workosUser, extension)),
		);
	}

	if (subjectType === "organization") {
		let workosOrg;
		try {
			workosOrg = await workos.organizations.get(
				c.env.WORKOS_API_KEY,
				subjectId,
			);
		} catch {
			return notFound(c, "Organization");
		}
		const [extension] = await db
			.select()
			.from(organizations)
			.where(eq(organizations.workosOrgId, subjectId))
			.limit(1);
		return c.json(
			itemResponse(mergeOrgResponse(workosOrg, extension)),
		);
	}

	if (subjectType === "workspace") {
		const [workspace] = await db
			.select()
			.from(workspaces)
			.where(eq(workspaces.id, subjectId))
			.limit(1);
		if (!workspace) return notFound(c, "Workspace");
		return c.json(itemResponse(workspace));
	}

	return notFound(c, "Subject");
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/me",
	description: "Get current authenticated subject identity",
	auth_required: true,
};
