/** @format */

import { Hono } from "hono";
import { requireAuth, requireScope } from "../../auth/helpers";
import { getDB } from "../../db";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { extractStatus } from "@vesta-cx/auth";
import { createEratoWorkOSTransport } from "../../auth/runtime";
import {
	mergeOrgResponse,
	getOrganizationExtension,
} from "../../services/organizations";
import { notFound } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/organizations/:id" as const;

route.get(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "organizations:read");

	const id = c.req.param("id");
	const db = getDB(c.env.DB);

	const [workosOrg, extension] = await Promise.all([
		createEratoWorkOSTransport(c.env)
			.getOrganization({ organizationId: id })
			.catch((error) => {
				if (extractStatus(error) === 404) return null;
				throw error;
			}),
		getOrganizationExtension(db, id),
	]);

	if (!workosOrg) return notFound(c, "Organization");
	return c.json(itemResponse(mergeOrgResponse(workosOrg, extension)));
});

export default {
	route,
	method: "GET" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Get organization by id",
	auth_required: true,
	scopes: ["organizations:read"],
};
