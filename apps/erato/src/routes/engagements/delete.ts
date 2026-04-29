/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
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

route.delete(PATH, async (c) => {
	const id = c.req.param("id");
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "engagements:write");

	const deleted = await getDB(c.env.DB).transaction(async (tx) => {
		const [existing] = await tx
			.select({ id: engagements.id })
			.from(engagements)
			.where(eq(engagements.id, id))
			.limit(1);
		if (!existing) return false;

		await tx
			.delete(engagementComments)
			.where(eq(engagementComments.engagementId, id));
		await tx
			.delete(engagementMentions)
			.where(eq(engagementMentions.engagementId, id));
		await tx.delete(engagements).where(eq(engagements.id, id));
		return true;
	});

	return deleted ? c.body(null, 204) : notFound(c, "Engagement");
});

export default {
	route,
	method: "DELETE" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Delete engagement",
	auth_required: true,
	scopes: ["engagements:write"],
	scopes_any: [ADMIN_SCOPE, "engagements:write"],
};
