/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { extractStatus } from "@vesta-cx/auth";
import { requireAuth, requireScope } from "../../auth/helpers";
import { createEratoWorkOSTransport } from "../../auth/runtime";
import { getDB } from "../../db";
import { organizations } from "../../db/schema";
import { notFound } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/organizations/:id" as const;
const WORKOS_ORG_ID_PATTERN = /^org_[a-zA-Z0-9_]+$/;

route.delete(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "organizations:write");

	const id = c.req.param("id");
	if (!WORKOS_ORG_ID_PATTERN.test(id)) return notFound(c, "Organization");

	try {
		await createEratoWorkOSTransport(c.env).deleteOrganization({
			organizationId: id,
		});
	} catch (error) {
		if (extractStatus(error) === 404)
			return notFound(c, "Organization");
		throw error;
	}

	const db = getDB(c.env.DB);
	await db.delete(organizations).where(eq(organizations.workosOrgId, id));

	return c.body(null, 204);
});

export default {
	route,
	method: "DELETE" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Delete organization",
	auth_required: true,
	scopes: ["organizations:write"],
};
