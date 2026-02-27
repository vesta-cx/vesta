/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth } from "../../auth/helpers";
import { getDB } from "../../db";
import { features } from "../../db/schema";
import { forbidden, notFound } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.get("/features/:slug", async (c) => {
	const auth = requireAuth(c.get("auth"));
	const db = getDB(c.env.DB);
	const slug = c.req.param("slug");

	if (hasScope(auth, "admin")) {
		const [row] = await db
			.select()
			.from(features)
			.where(eq(features.slug, slug))
			.limit(1);
		return row ? c.json(itemResponse(row)) : notFound(c, "Feature");
	}

	{
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
	auth_required: true,
	scopes: ["features:read"],
};
