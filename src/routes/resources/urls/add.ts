/** @format */

import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope } from "../../../auth/helpers";
import { getDB } from "../../../db";
import { externalLinks } from "../../../db/schema";
import { conflict } from "../../../lib/errors";
import { parseBody, isResponse } from "../../../lib/validation";
import { addExternalLinkSchema } from "../../links/shared";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const route = new Hono<AppEnv>();

route.post("/resources/:resourceId/urls", async (c) => {
	const auth = requireAuth(c.get("auth"));

	requireScope(auth, "resources:write");

	const parsed = await parseBody(c, addExternalLinkSchema);
	if (isResponse(parsed)) return parsed;

	const db = getDB(c.env.DB);
	const resourceId = c.req.param("resourceId");

	try {
		const [row] = await db
			.insert(externalLinks)
			.values({
				subjectType: "resource",
				subjectId: resourceId,
				...parsed,
			})
			.returning();
		return c.json(itemResponse(row!), 201);
	} catch (err) {
		if (err instanceof Error && /UNIQUE/i.test(err.message)) {
			return conflict(
				c,
				"URL at this position already exists",
				"position",
			);
		}
		throw err;
	}
});

export default {
	route,
	method: "POST" as RouteMetadata["method"],
	path: "/resources/:resourceId/urls",
	description: "Add URL to resource",
	auth_required: true,
	scopes: ["resources:write"],
};
