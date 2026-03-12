/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { requireAuth, requireScope } from "../../auth/helpers";
import { getDB } from "../../db";
import { organizations } from "../../db/schema";
import { workos } from "../../services/workos";
import { notFound, singleError } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.delete("/organizations/:id", async (c) => {
	const auth = requireAuth(c.get("auth"));

	requireScope(auth, "organizations:write");

	const id = c.req.param("id");

	try {
		await workos.organizations.delete(c.env.WORKOS_API_KEY, id);
	} catch {
		return notFound(c, "Organization");
	}

	const db = getDB(c.env.DB);
	await db.delete(organizations).where(eq(organizations.workosOrgId, id));

	return c.body(null, 204);
});

export default {
	route,
	method: "DELETE" as RouteMetadata["method"],
	path: "/organizations/:id",
	description: "Delete organization",
	auth_required: true,
	scopes: ["organizations:write"],
};
