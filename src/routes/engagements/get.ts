import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireScope } from "../../auth/helpers";
import { getDb } from "../../db";
import {
	engagementComments,
	engagementMentions,
	engagements,
} from "../../db/schema";
import { notFound } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.get("/engagements/:id", async (c) => {
	const id = c.req.param("id");
	const auth = c.get("auth");
	requireScope(auth, "engagements:read");

	const db = getDb(c.env.DB);

	const [engagement] = await db
		.select()
		.from(engagements)
		.where(eq(engagements.id, id));
	if (!engagement) return notFound(c, "Engagement");

	const [comment] = await db
		.select()
		.from(engagementComments)
		.where(eq(engagementComments.engagementId, id));

	const [mention] = await db
		.select()
		.from(engagementMentions)
		.where(eq(engagementMentions.engagementId, id));

	const payload = {
		...engagement,
		comment: comment ?? null,
		mention: mention ?? null,
	};

	return c.json(itemResponse(payload));
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/engagements/:id",
	description: "Get engagement by id",
	auth_required: true,
	scopes: ["engagements:read"],
};
