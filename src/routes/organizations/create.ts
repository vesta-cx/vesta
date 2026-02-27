/** @format */

import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope } from "../../auth/helpers";
import { getDB } from "../../db";
import { organizations } from "../../db/schema";
import { workos } from "../../services/workos";
import {
	createOrganizationSchema,
	mergeOrgResponse,
} from "../../services/organizations";
import { parseBody, isResponse } from "../../lib/validation";
import { singleError } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.post("/organizations", async (c) => {
	const auth = requireAuth(c.get("auth"));

	requireScope(auth, "organizations:write");

	const parsed = await parseBody(c, createOrganizationSchema);
	if (isResponse(parsed)) return parsed;

	let workosOrg;
	try {
		workosOrg = await workos.organizations.create(
			c.env.WORKOS_API_KEY,
			{ name: parsed.name },
		);
	} catch (err) {
		return singleError(
			c,
			500,
			`Failed to create organization on WorkOS: ${err instanceof Error ? err.message : "unknown"}`,
			"WORKOS_ERROR",
		);
	}

	const db = getDB(c.env.DB);
	const hasLocalFields =
		parsed.avatarUrl !== undefined ||
		parsed.bannerUrl !== undefined ||
		parsed.themeConfig !== undefined;

	let extension = null;
	if (hasLocalFields) {
		try {
			const [row] = await db
				.insert(organizations)
				.values({
					workosOrgId: workosOrg.id,
					avatarUrl: parsed.avatarUrl ?? null,
					bannerUrl: parsed.bannerUrl ?? null,
					themeConfig: parsed.themeConfig ?? null,
				})
				.returning();
			extension = row ?? null;
		} catch (err) {
			return singleError(
				c,
				500,
				`Organization created on WorkOS (${workosOrg.id}) but failed to save local extensions. Retry with PUT /organizations/${workosOrg.id}.`,
				"PARTIAL_WRITE",
			);
		}
	}

	return c.json(
		itemResponse(mergeOrgResponse(workosOrg, extension)),
		201,
	);
});

export default {
	route,
	method: "POST" as RouteMetadata["method"],
	path: "/organizations",
	description: "Create organization",
	auth_required: true,
	scopes: ["organizations:write"],
};
