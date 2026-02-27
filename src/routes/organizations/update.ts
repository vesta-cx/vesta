/** @format */

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope } from "../../auth/helpers";
import { getDB } from "../../db";
import { organizations } from "../../db/schema";
import { workos } from "../../services/workos";
import {
	updateOrganizationSchema,
	splitUpdateFields,
	mergeOrgResponse,
} from "../../services/organizations";
import { parseBody, isResponse } from "../../lib/validation";
import { notFound, singleError } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.put("/organizations/:id", async (c) => {
	const auth = requireAuth(c.get("auth"));

	requireScope(auth, "organizations:write");

	const id = c.req.param("id");
	const parsed = await parseBody(c, updateOrganizationSchema);
	if (isResponse(parsed)) return parsed;

	const { workos: workosFields, local: localFields } =
		splitUpdateFields(parsed);
	const hasWorkosChanges = Object.keys(workosFields).length > 0;
	const hasLocalChanges = Object.keys(localFields).length > 0;

	let workosOrg;
	try {
		workosOrg =
			hasWorkosChanges ?
				await workos.organizations.update(
					c.env.WORKOS_API_KEY,
					id,
					workosFields as { name?: string },
				)
			:	await workos.organizations.get(
					c.env.WORKOS_API_KEY,
					id,
				);
	} catch {
		return notFound(c, "Organization");
	}

	const db = getDB(c.env.DB);
	let extension = null;

	if (hasLocalChanges) {
		try {
			const [existing] = await db
				.select()
				.from(organizations)
				.where(eq(organizations.workosOrgId, id))
				.limit(1);

			if (existing) {
				const [updated] = await db
					.update(organizations)
					.set(localFields)
					.where(
						eq(
							organizations.workosOrgId,
							id,
						),
					)
					.returning();
				extension = updated ?? existing;
			} else {
				const [inserted] = await db
					.insert(organizations)
					.values({
						workosOrgId: id,
						...localFields,
					} as typeof organizations.$inferInsert)
					.returning();
				extension = inserted ?? null;
			}
		} catch (err) {
			return singleError(
				c,
				500,
				`WorkOS update succeeded but local extension write failed. Retry the request.`,
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
	method: "PUT" as RouteMetadata["method"],
	path: "/organizations/:id",
	description: "Update organization",
	auth_required: true,
	scopes: ["organizations:write"],
};
