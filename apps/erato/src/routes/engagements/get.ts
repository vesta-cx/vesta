/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope } from "../../auth/helpers";
import { ADMIN_SCOPE } from "../../auth/types";
import { getDB } from "../../db";
import {
	engagementComments,
	engagementMentions,
	engagements,
} from "../../db/schema";
import { notFound } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/engagements/:id" as const;

route.get(PATH, async (c) => {
	const id = c.req.param("id");
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "engagements:read");

	const db = getDB(c.env.DB);
	const [engagement] = await db
		.select()
		.from(engagements)
		.where(eq(engagements.id, id))
		.limit(1);
	if (!engagement) return notFound(c, "Engagement");

	const [commentRows, mentionRows] = await Promise.all([
		db
			.select()
			.from(engagementComments)
			.where(eq(engagementComments.engagementId, id))
			.limit(1),
		db
			.select()
			.from(engagementMentions)
			.where(eq(engagementMentions.engagementId, id))
			.limit(1),
	]);

	return c.json(
		itemResponse({
			...engagement,
			comment: commentRows[0] ?? null,
			mention: mentionRows[0] ?? null,
		}),
	);
});

export default {
	route,
	method: "GET" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Get engagement by id",
	auth_required: true,
	scopes: ["engagements:read"],
	scopes_any: [ADMIN_SCOPE, "engagements:read"],
};
