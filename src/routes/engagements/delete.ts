import { eq } from "drizzle-orm";
import { Hono } from "hono";
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

route.delete("/engagements/:id", async (c) => {
	const id = c.req.param("id");
	const auth = c.get("auth");
	requireScope(auth, "engagements:write");

	const db = getDb(c.env.DB);

	const [existing] = await db
		.select()
		.from(engagements)
		.where(eq(engagements.id, id));
	if (!existing) return notFound(c, "Engagement");

	await db.delete(engagementComments).where(eq(engagementComments.engagementId, id));
	await db.delete(engagementMentions).where(eq(engagementMentions.engagementId, id));
	await db.delete(engagements).where(eq(engagements.id, id));

	return c.body(null, 204);
});

export default {
	route,
	method: "DELETE" as RouteMetadata["method"],
	path: "/engagements/:id",
	description: "Delete engagement",
	auth_required: true,
	scopes: ["engagements:write"],
};
