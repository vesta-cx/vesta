import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { requireAuth, requireScope } from "../../../auth/helpers";
import { getDb } from "../../../db";
import {
	ENGAGEMENT_FILTER_ACTIONS,
	collections,
	collectionVisibilitySettings,
} from "../../../db/schema";
import { forbidden, notFound } from "../../../lib/errors";
import { parseBody, isResponse, z } from "../../../lib/validation";
import { isCollectionOwner } from "../../../services/collections";
import type { AppEnv } from "../../../env";
import type { RouteMetadata } from "../../../registry";

const visibilityItemSchema = z.object({
	engagementType: z.enum(ENGAGEMENT_FILTER_ACTIONS),
	isVisible: z.boolean(),
});

const updateVisibilitySchema = z.array(visibilityItemSchema);

const route = new Hono<AppEnv>();

route.put("/collections/:collectionId/visibility", async (c) => {
	const auth = c.get("auth");
	requireScope(auth, "collections:write");
	const apiAuth = requireAuth(auth);

	const parsed = await parseBody(c, updateVisibilitySchema);
	if (isResponse(parsed)) return parsed;

	const db = getDb(c.env.DB);
	const collectionId = c.req.param("collectionId");

	const [existing] = await db
		.select()
		.from(collections)
		.where(eq(collections.id, collectionId))
		.limit(1);
	if (!existing) return notFound(c, "Collection");

	const isAdmin = apiAuth.scopes.includes("admin");
	const isOwner = await isCollectionOwner(db, existing, apiAuth.userId);
	if (!isAdmin && !isOwner) return forbidden(c);

	await db
		.delete(collectionVisibilitySettings)
		.where(eq(collectionVisibilitySettings.collectionId, collectionId));

	if (parsed.length > 0) {
		await db.insert(collectionVisibilitySettings).values(
			parsed.map((item) => ({
				collectionId,
				engagementType: item.engagementType,
				isVisible: item.isVisible,
			})),
		);
	}

	const rows = await db
		.select()
		.from(collectionVisibilitySettings)
		.where(eq(collectionVisibilitySettings.collectionId, collectionId));

	return c.json({ data: rows });
});

export default {
	route,
	method: "PUT" as RouteMetadata["method"],
	path: "/collections/:collectionId/visibility",
	description: "Update collection visibility settings",
	auth_required: true,
	scopes: ["collections:write"],
};
