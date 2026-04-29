/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { isAuthenticated, requireAuth } from "../auth/helpers";
import { startBrowserLogin } from "../auth/browser";
import { getDB } from "../db";
import { users, workspaces, organizations } from "../db/schema";
import {
	createWorkOSTransport,
	extractStatus,
	type AuthOrganization,
	type AuthUser,
} from "@vesta-cx/auth";
import { mergeOrgResponse } from "../services/organizations";
import { notFound } from "../lib/errors";
import type { AppEnv } from "../env";
import type { RouteMetadata } from "../registry";

const mergeUserResponse = (
	workosUser: AuthUser,
	extension?: typeof users.$inferSelect | null,
) => ({
	id: workosUser.id,
	email: workosUser.email,
	firstName: workosUser.firstName,
	lastName: workosUser.lastName,
	organizationId: extension?.organizationId ?? workosUser.organizationId,
	displayName: extension?.displayName ?? null,
	avatarUrl: extension?.avatarUrl ?? null,
	bio: extension?.bio ?? null,
	themeConfig: extension?.themeConfig ?? null,
	createdAt: extension?.createdAt ?? workosUser.createdAt,
	updatedAt: extension?.updatedAt ?? workosUser.updatedAt,
});

const route = new Hono<AppEnv>();

const returnNotFoundOnlyFor404 = async <T>(
	operation: Promise<T>,
): Promise<T | null> => {
	try {
		return await operation;
	} catch (error) {
		if (extractStatus(error) === 404) return null;
		throw error;
	}
};

route.get("/me", async (c) => {
	const currentAuth = c.get("auth");
	if (!isAuthenticated(currentAuth)) {
		return startBrowserLogin(c);
	}

	const auth = requireAuth(currentAuth);

	const { subjectType, subjectId } = auth;
	const db = getDB(c.env.DB);
	const workosTransport = createWorkOSTransport({
		apiKey: c.env.WORKOS_API_KEY,
	});

	if (subjectType === "user") {
		const [workosUser, [extension]] = await Promise.all([
			returnNotFoundOnlyFor404(
				workosTransport.getUser({ userId: subjectId }),
			),
			db
				.select()
				.from(users)
				.where(eq(users.workosUserId, subjectId))
				.limit(1),
		]);
		if (!workosUser) return notFound(c, "User");
		return c.json(
			itemResponse(
				mergeUserResponse(
					workosUser as AuthUser,
					extension,
				),
			),
		);
	}

	if (subjectType === "organization") {
		const [workosOrg, [extension]] = await Promise.all([
			returnNotFoundOnlyFor404(
				workosTransport.getOrganization({
					organizationId: subjectId,
				}),
			),
			db
				.select()
				.from(organizations)
				.where(eq(organizations.workosOrgId, subjectId))
				.limit(1),
		]);
		if (!workosOrg) return notFound(c, "Organization");
		return c.json(
			itemResponse(
				mergeOrgResponse(
					workosOrg as AuthOrganization,
					extension,
				),
			),
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
