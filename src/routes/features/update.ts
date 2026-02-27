/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, hasScope } from "../../auth/helpers";
import { getDB } from "../../db";
import { features } from "../../db/schema";
import { conflict, forbidden, notFound } from "../../lib/errors";
import { parseBody, isResponse } from "../../lib/validation";
import { updateFeatureSchema } from "../../services/features";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.put("/features/:slug", async (c) => {
	const auth = requireAuth(c.get("auth"));
	if (!hasScope(auth, "admin")) return forbidden(c);

	const slug = c.req.param("slug");
	const parsed = await parseBody(c, updateFeatureSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDB(c.env.DB);
	const [existing] = await db
		.select()
		.from(features)
		.where(eq(features.slug, slug))
		.limit(1);
	if (!existing) return notFound(c, "Feature");

	try {
		const [row] = await db
			.update(features)
			.set({ ...parsed, updatedAt: new Date() })
			.where(eq(features.slug, slug))
			.returning();
		return row ? c.json(itemResponse(row)) : notFound(c, "Feature");
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
	path: "/features/:slug",
	description: "Update feature",
	auth_required: true,
	scopes: ["admin"],
};
