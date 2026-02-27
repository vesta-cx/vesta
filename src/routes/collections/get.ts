/** @format */

import { and, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { itemResponse } from "@mia-cx/drizzle-query-factory";
import { hasScope, requireAuth } from "../../auth/helpers";
import { getDB } from "../../db";
import {
	COLLECTION_PERMISSION_ACTIONS,
	collections,
	permissions,
} from "../../db/schema";
import { forbidden, notFound } from "../../lib/errors";
import type { AppEnv } from "../../env";
import type { RouteMetadata } from "../../registry";

const route = new Hono<AppEnv>();

route.get("/collections/:id", async (c) => {
	const auth = requireAuth(c.get("auth"));
	const db = getDB(c.env.DB);
	const id = c.req.param("id");

	if (!hasScope(auth, "admin") && !hasScope(auth, "collections:read")) {
		return forbidden(c);
	}

	const [row] = await db
		.select()
		.from(collections)
		.where(eq(collections.id, id))
		.limit(1);
	if (!row) return notFound(c, "Collection");

	if (hasScope(auth, "admin")) {
		return c.json(itemResponse(row));
	}

	const isOwner =
		auth.subjectType === "user" || auth.subjectType === "workspace" ?
			row.ownerType === auth.subjectType &&
			row.ownerId === auth.subjectId
		:	undefined;
	if (isOwner) return c.json(itemResponse(row));

	const relevantRows = await db
		.select({
			subjectType: permissions.subjectType,
			subjectId: permissions.subjectId,
			value: permissions.value,
		})
		.from(permissions)
		.where(
			and(
				eq(permissions.objectType, "collection"),
				eq(permissions.objectId, id),
				eq(permissions.action, COLLECTION_PERMISSION_ACTIONS[0]),
				inArray(permissions.value, ["allow", "deny"]),
			),
		);

	const canReadViaPermissions = relevantRows.some((permission) => {
		const isAuthSubject =
			permission.subjectType === auth.subjectType &&
			permission.subjectId === auth.subjectId;
		const isStaticUser =
			permission.subjectType === "static" &&
			permission.subjectId === "user";
		return (
			(isAuthSubject || isStaticUser) && permission.value === "allow"
		);
	});

	if (row.status === "LISTED" || canReadViaPermissions) {
		return c.json(itemResponse(row));
	}

	return notFound(c, "Collection");
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/collections/:id",
	description: "Get collection by ID",
	auth_required: true,
	scopes: ["collections:read"],
};
