/** @format */

import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope } from "../../auth/helpers";
import { createEratoWorkOSTransport } from "../../auth/runtime";
import { getDB } from "../../db";
import { organizations } from "../../db/schema";
import { expectOne } from "../../lib/db-helpers";
import { singleError } from "../../lib/errors";
import { parseBody, isResponse } from "../../lib/validation";
import {
	createOrganizationSchema,
	mergeOrgResponse,
} from "../../services/organizations";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/organizations" as const;

route.post(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "organizations:write");

	const parsed = await parseBody(c, createOrganizationSchema);
	if (isResponse(parsed)) return parsed;

	const workosTransport = createEratoWorkOSTransport(c.env);
	let workosOrg;
	try {
		workosOrg = await workosTransport.createOrganization({
			name: parsed.name,
		});
	} catch (err) {
		return singleError(
			c,
			500,
			`Failed to create organization on WorkOS: ${err instanceof Error ? err.message : "unknown"}`,
			"WORKOS_ERROR",
		);
	}

	const hasLocalFields =
		parsed.avatarUrl !== undefined ||
		parsed.bannerUrl !== undefined ||
		parsed.themeConfig !== undefined;

	let extension = null;
	if (hasLocalFields) {
		try {
			const rows = await getDB(c.env.DB)
				.insert(organizations)
				.values({
					workosOrgId: workosOrg.id,
					avatarUrl: parsed.avatarUrl ?? null,
					bannerUrl: parsed.bannerUrl ?? null,
					themeConfig: parsed.themeConfig ?? null,
				})
				.returning();
			extension = expectOne(
				rows,
				"Organization extension insert",
			);
		} catch (err) {
			await workosTransport
				.deleteOrganization({
					organizationId: workosOrg.id,
				})
				.catch((rollbackError) => {
					console.error(
						"Failed to roll back WorkOS organization after local extension write failed",
						rollbackError,
					);
				});
			return singleError(
				c,
				500,
				`Organization created on WorkOS (${workosOrg.id}) but failed to save local extensions.`,
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
	method: "POST" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Create organization",
	auth_required: true,
	scopes: ["organizations:write"],
};
