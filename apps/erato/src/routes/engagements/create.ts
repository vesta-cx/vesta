/** @format */

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
import { expectOne } from "../../lib/db-helpers";
import { parseBody, isResponse } from "../../lib/validation";
import { createEngagementSchema } from "../../services/engagements";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/engagements" as const;

route.post(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "engagements:write");

	const parsed = await parseBody(c, createEngagementSchema);
	if (isResponse(parsed)) return parsed;

	const payload = await getDB(c.env.DB).transaction(async (tx) => {
		const engagement = expectOne(
			await tx
				.insert(engagements)
				.values({
					subjectType: parsed.subjectType,
					subjectId: parsed.subjectId,
					action: parsed.action,
					objectType: parsed.objectType,
					objectId: parsed.objectId,
				})
				.returning(),
			"Engagement insert",
		);

		const comment =
			parsed.comment ?
				expectOne(
					await tx
						.insert(engagementComments)
						.values({
							engagementId:
								engagement.id,
							text: parsed.comment
								.text,
						})
						.returning(),
					"Engagement comment insert",
				)
			:	null;

		const mention =
			parsed.mention ?
				expectOne(
					await tx
						.insert(engagementMentions)
						.values({
							engagementId:
								engagement.id,
							mentionedType:
								parsed.mention
									.mentionedType,
							mentionedId:
								parsed.mention
									.mentionedId,
						})
						.returning(),
					"Engagement mention insert",
				)
			:	null;

		return { ...engagement, comment, mention };
	});

	return c.json(itemResponse(payload), 201);
});

export default {
	route,
	method: "POST" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Create engagement",
	auth_required: true,
	scopes: ["engagements:write"],
	scopes_any: [ADMIN_SCOPE, "engagements:write"],
};
