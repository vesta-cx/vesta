import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { hasScope, isAuthenticated } from "../../auth/helpers";
import { getDb } from "../../db";
import { features } from "../../db/schema";
import { forbidden, notFound } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.get("/features/:slug", async (c) => {
	const auth = c.get("auth");
	const db = getDb(c.env.DB);
	const slug = c.req.param("slug");

	if (isAuthenticated(auth) && auth.scopes.includes("admin")) {
		const [row] = await db
			.select()
			.from(features)
			.where(eq(features.slug, slug))
			.limit(1);
		return row ? c.json(itemResponse(row)) : notFound(c, "Feature");
	}

	if (isAuthenticated(auth)) {
		if (!hasScope(auth, "features:read")) return forbidden(c);
		const [row] = await db
			.select()
			.from(features)
			.where(eq(features.slug, slug))
			.limit(1);
		return row ? c.json(itemResponse(row)) : notFound(c, "Feature");
	}

	const [row] = await db
		.select()
		.from(features)
		.where(eq(features.slug, slug))
		.limit(1);
	return row ? c.json(itemResponse(row)) : notFound(c, "Feature");
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/features/:slug",
	description: "Get feature by slug",
	auth_required: false,
	scopes: ["features:read"],
};
