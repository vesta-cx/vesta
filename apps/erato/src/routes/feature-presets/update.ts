/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope } from "../../auth/helpers";
import { ADMIN_SCOPE } from "../../auth/types";
import { getDB } from "../../db";
import { featurePresets } from "../../db/schema";
import { isUniqueConstraintError } from "../../lib/db-helpers";
import { conflict, notFound } from "../../lib/errors";
import { parseBody, isResponse } from "../../lib/validation";
import { updateFeaturePresetSchema } from "../../services/features";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/feature-presets/:name" as const;

route.put(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, ADMIN_SCOPE);

	const name = c.req.param("name");
	const parsed = await parseBody(c, updateFeaturePresetSchema);
	if (isResponse(parsed)) return parsed;

	try {
		const [row] = await getDB(c.env.DB)
			.update(featurePresets)
			.set({ ...parsed, updatedAt: new Date() })
			.where(eq(featurePresets.name, name))
			.returning();
		return row ?
				c.json(itemResponse(row))
			:	notFound(c, "Feature preset");
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
	description: "Update feature preset",
	auth_required: true,
	scopes: [ADMIN_SCOPE],
};
