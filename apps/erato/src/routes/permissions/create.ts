/** @format */

import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { requireAuth, requireScope } from "../../auth/helpers";
import { getDB } from "../../db";
import { permissions } from "../../db/schema";
import { conflict, singleError } from "../../lib/errors";
import {
	expectOne,
	isForeignKeyConstraintError,
	isUniqueConstraintError,
} from "../../lib/db-helpers";
import { parseBody, isResponse } from "../../lib/validation";
import { createPermissionSchema } from "../../services/permissions";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();
const PATH = "/permissions" as const;
const COLLECTION_OBJECT_TYPE = "collection";

route.post(PATH, async (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, "permissions:write");

	const parsed = await parseBody(c, createPermissionSchema);
	if (isResponse(parsed)) return parsed;

	if (parsed.objectType === COLLECTION_OBJECT_TYPE) {
		requireScope(auth, "collections:write");
	}

	const db = getDB(c.env.DB);
	try {
		const rows = await db
			.insert(permissions)
			.values(parsed)
			.returning();
		return c.json(
			itemResponse(expectOne(rows, "Permission insert")),
			201,
		);
	} catch (err) {
		if (isUniqueConstraintError(err)) {
			return conflict(c, "Permission already exists");
		}
		if (isForeignKeyConstraintError(err)) {
			return singleError(
				c,
				422,
				"Referenced permission entity does not exist",
				"VALIDATION_ERROR",
			);
		}
		throw err;
	}
});

export default {
	route,
	method: "POST" satisfies RouteMetadata["method"],
	path: PATH,
	description: "Create permission",
	auth_required: true,
	scopes: ["permissions:write"],
};
