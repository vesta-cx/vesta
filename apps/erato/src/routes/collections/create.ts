/** @format */

import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth, requireScope } from "../../auth/helpers";
import { ADMIN_SCOPE } from "../../auth/types";
import { getDB } from "../../db";
import { collections } from "../../db/schema";
import { expectOne, isUniqueConstraintError } from "../../lib/db-helpers";
import { conflict, forbidden } from "../../lib/errors";
import { parseBody, isResponse } from "../../lib/validation";
import {
	AUTO_COLLECTION_ADMIN_MESSAGE,
	createCollectionSchema,
	isAutoCollection,
} from "../../services/collections";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/collections" as const;

route.post(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "collections:write");

	const parsed = await parseBody(c, createCollectionSchema);
	if (isResponse(parsed)) return parsed;

	const isAdmin = hasScope(auth, ADMIN_SCOPE);
	if (!isAdmin && isAutoCollection({ type: parsed.type ?? "manual" })) {
		return forbidden(c, AUTO_COLLECTION_ADMIN_MESSAGE);
	}

	try {
		const rows = await getDB(c.env.DB)
			.insert(collections)
			.values({ ...parsed, type: parsed.type ?? "manual" })
			.returning();
		return c.json(
			itemResponse(expectOne(rows, "Collection insert")),
			201,
		);
	} catch (err) {
		if (isUniqueConstraintError(err)) {
			return conflict(c, "Collection already exists");
		}
		throw err;
	}
});

export default {
	route,
	method: "POST" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Create collection",
	auth_required: true,
	scopes: ["collections:write"],
	scopes_any: [ADMIN_SCOPE, "collections:write"],
};
