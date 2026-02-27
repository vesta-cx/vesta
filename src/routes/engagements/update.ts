/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireScope } from "../../auth/helpers";
import { getDB } from "../../db";
import {
	engagementComments,
	engagementMentions,
	engagements,
} from "../../db/schema";
import { parseBody, isResponse } from "../../lib/validation";
import { notFound } from "../../lib/errors";
import { z } from "../../lib/validation";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const updateEngagementSchema = z.object({
	comment: z
		.object({
			text: z.string().min(1),
		})
		.nullable()
		.optional(),
	mention: z
		.object({
			mentionedType: z.string().min(1),
			mentionedId: z.string().min(1),
		})
		.nullable()
		.optional(),
});

const route = new Hono<AppEnv>();

route.put("/engagements/:id", async (c) => {
	const id = c.req.param("id");
	const auth = c.get("auth");
	requireScope(auth, "engagements:write");

	const parsed = await parseBody(c, updateEngagementSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDB(c.env.DB);

	const [existing] = await db
		.select()
		.from(engagements)
		.where(eq(engagements.id, id));
	if (!existing) return notFound(c, "Engagement");

	if (parsed.comment !== undefined) {
		if (parsed.comment === null) {
			await db
				.delete(engagementComments)
				.where(eq(engagementComments.engagementId, id));
		} else {
			const [existingComment] = await db
				.select()
				.from(engagementComments)
				.where(eq(engagementComments.engagementId, id));
			if (existingComment) {
				await db
					.update(engagementComments)
					.set({ text: parsed.comment.text })
					.where(
						eq(
							engagementComments.engagementId,
							id,
						),
					);
			} else {
				await db.insert(engagementComments).values({
					engagementId: id,
					text: parsed.comment.text,
				});
			}
		}
	}

	if (parsed.mention !== undefined) {
		if (parsed.mention === null) {
			await db
				.delete(engagementMentions)
				.where(eq(engagementMentions.engagementId, id));
		} else {
			const mentionValues = {
				mentionedType: parsed.mention.mentionedType as
					| "user"
					| "workspace"
					| "resource",
				mentionedId: parsed.mention.mentionedId,
			};
			const [existingMention] = await db
				.select()
				.from(engagementMentions)
				.where(eq(engagementMentions.engagementId, id));
			if (existingMention) {
				await db
					.update(engagementMentions)
					.set(mentionValues)
					.where(
						eq(
							engagementMentions.engagementId,
							id,
						),
					);
			} else {
				await db.insert(engagementMentions).values({
					engagementId: id,
					...mentionValues,
				});
			}
		}
	}

	const [engagement] = await db
		.select()
		.from(engagements)
		.where(eq(engagements.id, id));

	const [comment] = await db
		.select()
		.from(engagementComments)
		.where(eq(engagementComments.engagementId, id));

	const [mention] = await db
		.select()
		.from(engagementMentions)
		.where(eq(engagementMentions.engagementId, id));

	return c.json(
		itemResponse({
			...engagement,
			comment: comment ?? null,
			mention: mention ?? null,
		}),
	);
});

export default {
	route,
	method: "PUT" as RouteMetadata["method"],
	path: "/engagements/:id",
	description: "Update engagement",
	auth_required: true,
	scopes: ["engagements:write"],
};
