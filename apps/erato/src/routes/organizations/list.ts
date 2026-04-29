/** @format */

import { inArray } from "drizzle-orm";
import { Hono } from "hono";
import { requireAuth, requireScope } from "../../auth/helpers";
import { createEratoWorkOSTransport } from "../../auth/runtime";
import { getDB } from "../../db";
import { organizations } from "../../db/schema";
import { singleError } from "../../lib/errors";
import { mergeOrgResponse } from "../../services/organizations";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/organizations" as const;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const parseLimit = (value: string | undefined) => {
	if (!value) return DEFAULT_PAGE_SIZE;
	const limit = Number(value);
	return Number.isInteger(limit) && limit > 0 && limit <= MAX_PAGE_SIZE ?
			limit
		:	null;
};

route.get(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "organizations:read");

	const limit = parseLimit(c.req.query("limit"));
	if (limit === null) {
		return singleError(
			c,
			422,
			`limit must be an integer between 1 and ${MAX_PAGE_SIZE}`,
			"VALIDATION_ERROR",
			"limit",
		);
	}
	const after = c.req.query("after") || undefined;
	const before = c.req.query("before") || undefined;

	const workosResult = await createEratoWorkOSTransport(
		c.env,
	).listOrganizations({ limit, after, before });

	const db = getDB(c.env.DB);
	const orgIds = workosResult.data.map((o) => o.id);

	const extensionRows =
		orgIds.length > 0 ?
			await db
				.select()
				.from(organizations)
				.where(
					inArray(
						organizations.workosOrgId,
						orgIds,
					),
				)
		:	[];

	const extensionMap = new Map(
		extensionRows.map((e) => [e.workosOrgId, e]),
	);

	const data = workosResult.data.map((org) =>
		mergeOrgResponse(org, extensionMap.get(org.id)),
	);

	return c.json({
		data,
		list_metadata: {
			before: workosResult.before,
			after: workosResult.after,
		},
	});
});

export default {
	route,
	method: "GET" satisfies RouteMetadata["method"],
	path: PATH,
	description: "List organizations",
	auth_required: true,
	scopes: ["organizations:read"],
};
