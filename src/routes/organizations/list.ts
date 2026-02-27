/** @format */

import { inArray } from "drizzle-orm";
import { Hono } from "hono";
import { requireScope } from "../../auth/helpers";
import { getDB } from "../../db";
import { organizations } from "../../db/schema";
import { workos } from "../../services/workos";
import { mergeOrgResponse } from "../../services/organizations";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.get("/organizations", async (c) => {
	const auth = c.get("auth");
	requireScope(auth, "organizations:read");

	const url = new URL(c.req.url);
	const limit = Number(url.searchParams.get("limit")) || 20;
	const after = url.searchParams.get("after") ?? undefined;
	const before = url.searchParams.get("before") ?? undefined;

	const workosResult = await workos.organizations.list(
		c.env.WORKOS_API_KEY,
		{ limit, after, before },
	);

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
		list_metadata: workosResult.list_metadata,
	});
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/organizations",
	description: "List organizations",
	auth_required: true,
	scopes: ["organizations:read"],
};
