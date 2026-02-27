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
import { parseBody, isResponse } from "../../lib/validation";
import { createEngagementSchema } from "../../services/engagements";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.post("/engagements", async (c) => {
	const auth = c.get("auth");
	requireScope(auth, "engagements:write");

	const parsed = await parseBody(c, createEngagementSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDb(c.env.DB);

	const [row] = await db
		.insert(engagements)
		.values({
			subjectType: parsed.subjectType as "user" | "workspace",
			subjectId: parsed.subjectId,
			action: parsed.action,
			objectType: parsed.objectType,
			objectId: parsed.objectId,
		})
		.returning();
	if (!row) return c.json({ error: "Insert failed" }, 500);

	if (parsed.comment) {
		await db.insert(engagementComments).values({
			engagementId: row.id,
			text: parsed.comment.text,
		});
	}
	if (parsed.mention) {
		await db.insert(engagementMentions).values({
			engagementId: row.id,
			mentionedType: parsed.mention.mentionedType as "user" | "workspace" | "resource",
			mentionedId: parsed.mention.mentionedId,
		});
	}

	const [withExtras] = await db
		.select()
		.from(engagements)
		.where(eq(engagements.id, row.id));
	const [comment] = parsed.comment
		? await db
				.select()
				.from(engagementComments)
				.where(eq(engagementComments.engagementId, row.id))
		: [];
	const [mention] = parsed.mention
		? await db
				.select()
				.from(engagementMentions)
				.where(eq(engagementMentions.engagementId, row.id))
		: [];

	const payload = {
		...(withExtras ?? row),
		comment: comment ?? null,
		mention: mention ?? null,
	};

	return c.json(itemResponse(payload), 201);
});

export default {
	route,
	method: "POST" as RouteMetadata["method"],
	path: "/engagements",
	description: "Create engagement",
	auth_required: true,
	scopes: ["engagements:write"],
};
