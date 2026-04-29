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
import { parseBody, isResponse } from "../../lib/validation";
import { updateEngagementSchema } from "../../services/engagements";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/engagements/:id" as const;

route.put(PATH, async (c) => {
	const id = c.req.param("id");
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "engagements:write");

	const parsed = await parseBody(c, updateEngagementSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDB(c.env.DB);
	const payload = await db.transaction(async (tx) => {
		const [existing] = await tx
			.select()
			.from(engagements)
			.where(eq(engagements.id, id))
			.limit(1);
		if (!existing) return null;

		if (parsed.comment !== undefined) {
			if (parsed.comment === null) {
				await tx
					.delete(engagementComments)
					.where(
						eq(
							engagementComments.engagementId,
							id,
						),
					);
			} else {
				await tx
					.insert(engagementComments)
					.values({
						engagementId: id,
						text: parsed.comment.text,
					})
					.onConflictDoUpdate({
						target: engagementComments.engagementId,
						set: {
							text: parsed.comment
								.text,
						},
					});
			}
		}

		if (parsed.mention !== undefined) {
			if (parsed.mention === null) {
				await tx
					.delete(engagementMentions)
					.where(
						eq(
							engagementMentions.engagementId,
							id,
						),
					);
			} else {
				await tx
					.insert(engagementMentions)
					.values({
						engagementId: id,
						...parsed.mention,
					})
					.onConflictDoUpdate({
						target: engagementMentions.engagementId,
						set: parsed.mention,
					});
			}
		}

		const [comment, mention] = await Promise.all([
			tx
				.select()
				.from(engagementComments)
				.where(eq(engagementComments.engagementId, id))
				.limit(1),
			tx
				.select()
				.from(engagementMentions)
				.where(eq(engagementMentions.engagementId, id))
				.limit(1),
		]);

		return {
			...existing,
			comment: comment[0] ?? null,
			mention: mention[0] ?? null,
		};
	});

	return payload ?
			c.json(itemResponse(payload))
		:	notFound(c, "Engagement");
});

export default {
	route,
	method: "PUT" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Update engagement",
	auth_required: true,
	scopes: ["engagements:write"],
	scopes_any: [ADMIN_SCOPE, "engagements:write"],
};
