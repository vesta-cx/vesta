/** @format */

import { Hono } from "hono";
import { requireScope } from "../../auth/helpers";
import { getDB } from "../../db";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { workos } from "../../services/workos";
import {
	mergeOrgResponse,
	getOrCreateExtension,
} from "../../services/organizations";
import { notFound } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.get("/organizations/:id", async (c) => {
	const auth = c.get("auth");
	requireScope(auth, "organizations:read");

	const id = c.req.param("id");

	let workosOrg;
	try {
		workosOrg = await workos.organizations.get(
			c.env.WORKOS_API_KEY,
			id,
		);
	} catch {
		return notFound(c, "Organization");
	}

	const db = getDB(c.env.DB);
	const extension = await getOrCreateExtension(db, id);

	return c.json(itemResponse(mergeOrgResponse(workosOrg, extension)));
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/organizations/:id",
	description: "Get organization by id",
	auth_required: true,
	scopes: ["organizations:read"],
};
