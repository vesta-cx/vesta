import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth } from "../../auth/helpers";
import { getDb } from "../../db";
import { featurePresets } from "../../db/schema";
import { conflict, forbidden, notFound } from "../../lib/errors";
import { parseBody, isResponse } from "../../lib/validation";
import { updateFeaturePresetSchema } from "../../services/features";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.put("/feature-presets/:name", async (c) => {
	const auth = c.get("auth");
	const apiAuth = requireAuth(auth);
	if (!apiAuth.scopes.includes("admin")) return forbidden(c);

	const name = c.req.param("name");
	const parsed = await parseBody(c, updateFeaturePresetSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDb(c.env.DB);
	const [existing] = await db
		.select()
		.from(featurePresets)
		.where(eq(featurePresets.name, name))
		.limit(1);
	if (!existing) return notFound(c, "Feature preset");

	try {
		const [row] = await db
			.update(featurePresets)
			.set({ ...parsed, updatedAt: new Date() })
			.where(eq(featurePresets.name, name))
			.returning();
		return row ? c.json(itemResponse(row)) : notFound(c, "Feature preset");
	} catch (err) {
		if (err instanceof Error && /UNIQUE/i.test(err.message)) {
			return conflict(c, "Conflict on update");
		}
		throw err;
	}
});

export default {
	route,
	method: "PUT" as RouteMetadata["method"],
	path: "/feature-presets/:name",
	description: "Update feature preset",
	auth_required: true,
	scopes: ["admin"],
};
