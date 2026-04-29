/** @format */

import { Hono } from "hono";
import { requireAuth, requireScope } from "../../auth/helpers";
import { ADMIN_SCOPE } from "../../auth/types";
import { getDB } from "../../db";
import { resources } from "../../db/schema";
import { notFound } from "../../lib/errors";
import { resourceMutationWhere } from "../../services/resources";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/resources/:id" as const;

route.delete(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "resources:write");

	const [row] = await getDB(c.env.DB)
		.delete(resources)
		.where(resourceMutationWhere(auth, c.req.param("id")))
		.returning({ id: resources.id });
	if (!row) return notFound(c, "Resource");

	return c.body(null, 204);
});

export default {
	route,
	method: "DELETE" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Delete resource",
	auth_required: true,
	scopes: ["resources:write"],
	scopes_any: [ADMIN_SCOPE, "resources:write"],
};
