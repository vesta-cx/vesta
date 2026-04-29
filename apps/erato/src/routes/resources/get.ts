/** @format */

import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth } from "../../auth/helpers";
import { ADMIN_SCOPE } from "../../auth/types";
import { getDB } from "../../db";
import { resources } from "../../db/schema";
import { forbidden, notFound } from "../../lib/errors";
import { resourceAccessWhere } from "../../services/resources";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/resources/:id" as const;

route.get(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	const db = getDB(c.env.DB);
	const id = c.req.param("id");

	if (!hasScope(auth, "resources:read")) return forbidden(c);

	const accessWhere =
		hasScope(auth, ADMIN_SCOPE) ?
			eq(resources.id, id)
		:	and(eq(resources.id, id), resourceAccessWhere(db, auth, id));

	const [row] = await db
		.select()
		.from(resources)
		.where(accessWhere)
		.limit(1);
	return row ? c.json(itemResponse(row)) : notFound(c, "Resource");
});

export default {
	route,
	method: "GET" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Get resource by ID",
	auth_required: true,
	scopes: ["resources:read"],
	scopes_any: [ADMIN_SCOPE, "resources:read"],
};
