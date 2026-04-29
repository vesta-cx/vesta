/** @format */

import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope } from "../../auth/helpers";
import { ADMIN_SCOPE } from "../../auth/types";
import { getDB } from "../../db";
import { resources } from "../../db/schema";
import { isUniqueConstraintError } from "../../lib/db-helpers";
import { conflict, notFound } from "../../lib/errors";
import { parseBody, isResponse } from "../../lib/validation";
import {
	resourceMutationWhere,
	updateResourceSchema,
} from "../../services/resources";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/resources/:id" as const;

route.put(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "resources:write");

	const id = c.req.param("id");
	const parsed = await parseBody(c, updateResourceSchema);
	if (isResponse(parsed)) return parsed;

	try {
		const [row] = await getDB(c.env.DB)
			.update(resources)
			.set({ ...parsed, updatedAt: new Date() })
			.where(resourceMutationWhere(auth, id))
			.returning();
		return row ?
				c.json(itemResponse(row))
			:	notFound(c, "Resource");
	} catch (err) {
		if (isUniqueConstraintError(err))
			return conflict(c, "Conflict on update");
		throw err;
	}
});

export default {
	route,
	method: "PUT" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Update resource",
	auth_required: true,
	scopes: ["resources:write"],
	scopes_any: [ADMIN_SCOPE, "resources:write"],
};
