import { and, eq, inArray, or } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { hasScope, isAuthenticated } from "../../auth/helpers";
import { getDb } from "../../db";
import { permissions, resources } from "../../db/schema";
import { forbidden, notFound } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.get("/resources/:id", async (c) => {
	const auth = c.get("auth");
	const db = getDb(c.env.DB);
	const id = c.req.param("id");

	if (isAuthenticated(auth) && auth.scopes.includes("admin")) {
		const [row] = await db
			.select()
			.from(resources)
			.where(eq(resources.id, id))
			.limit(1);
		return row ? c.json(itemResponse(row)) : notFound(c, "Resource");
	}

	if (isAuthenticated(auth)) {
		if (!hasScope(auth, "resources:read")) return forbidden(c);

		const [row] = await db
			.select()
			.from(resources)
			.where(
				and(
					eq(resources.id, id),
					or(
						eq(resources.status, "LISTED"),
						inArray(
							resources.id,
							db
								.select({ id: permissions.objectId })
								.from(permissions)
								.where(
									and(
										eq(permissions.subjectId, auth.userId),
										eq(permissions.objectType, "resource"),
										eq(permissions.value, "allow"),
									),
								),
						),
					),
				),
			)
			.limit(1);
		return row ? c.json(itemResponse(row)) : notFound(c, "Resource");
	}

	const [row] = await db
		.select()
		.from(resources)
		.where(and(eq(resources.id, id), eq(resources.status, "LISTED")))
		.limit(1);
	return row ? c.json(itemResponse(row)) : notFound(c, "Resource");
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/resources/:id",
	description: "Get resource by ID",
	auth_required: false,
	scopes: ["resources:read"],
};
