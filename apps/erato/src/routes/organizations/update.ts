/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { extractStatus } from "@vesta-cx/auth";
import { requireAuth, requireScope } from "../../auth/helpers";
import { createEratoWorkOSTransport } from "../../auth/runtime";
import { getDB } from "../../db";
import { organizations } from "../../db/schema";
import { expectOne } from "../../lib/db-helpers";
import { notFound, singleError } from "../../lib/errors";
import { parseBody, isResponse } from "../../lib/validation";
import {
	updateOrganizationSchema,
	splitUpdateFields,
	mergeOrgResponse,
} from "../../services/organizations";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/organizations/:id" as const;

route.put(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "organizations:write");

	const id = c.req.param("id");
	const parsed = await parseBody(c, updateOrganizationSchema);
	if (isResponse(parsed)) return parsed;

	const { workos: workosFields, local: localFields } =
		splitUpdateFields(parsed);
	const hasWorkosChanges = Object.keys(workosFields).length > 0;
	const hasLocalChanges = Object.keys(localFields).length > 0;
	const workosTransport = createEratoWorkOSTransport(c.env);

	let workosOrg;
	try {
		workosOrg =
			(
				hasWorkosChanges &&
				typeof workosFields.name === "string"
			) ?
				await workosTransport.updateOrganization({
					organizationId: id,
					name: workosFields.name,
				})
			:	await workosTransport.getOrganization({
					organizationId: id,
				});
	} catch (error) {
		if (extractStatus(error) === 404)
			return notFound(c, "Organization");
		throw error;
	}

	const db = getDB(c.env.DB);
	let extension = null;

	if (hasLocalChanges) {
		try {
			const rows = await db
				.insert(organizations)
				.values({ workosOrgId: id, ...localFields })
				.onConflictDoUpdate({
					target: organizations.workosOrgId,
					set: localFields,
				})
				.returning();
			extension = expectOne(
				rows,
				"Organization extension upsert",
			);
		} catch (err) {
			return singleError(
				c,
				500,
				"WorkOS update succeeded but local extension write failed. Retry the request.",
				"PARTIAL_WRITE",
			);
		}
	} else {
		const [existing] = await db
			.select()
			.from(organizations)
			.where(eq(organizations.workosOrgId, id))
			.limit(1);
		extension = existing ?? null;
	}

	return c.json(itemResponse(mergeOrgResponse(workosOrg, extension)));
});

export default {
	route,
	method: "PUT" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Update organization",
	auth_required: true,
	scopes: ["organizations:write"],
};
