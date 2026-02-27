import { eq } from "drizzle-orm";
import type { ListQueryConfig } from "@mia-cx/drizzle-query-factory";
import type { Database } from "../db";
import {
	COLLECTION_OWNER_TYPES,
	COLLECTION_TYPES,
	COLLECTION_VISIBILITY,
	collections,
	workspaces,
} from "../db/schema";
import { z } from "../lib/validation";

export const collectionListConfig: ListQueryConfig = {
	filters: {
		owner_id: { column: collections.ownerId },
		owner_type: { column: collections.ownerType },
		type: { column: collections.type },
		visibility: { column: collections.visibility },
	},
	sortable: {
		created_at: collections.createdAt,
		updated_at: collections.updatedAt,
		name: collections.name,
	},
	defaultSort: { key: "created_at", dir: "desc" },
};

export const createCollectionSchema = z.object({
	ownerType: z.enum(COLLECTION_OWNER_TYPES),
	ownerId: z.string().min(1),
	name: z.string().min(1),
	description: z.string().nullable().optional(),
	type: z.enum(COLLECTION_TYPES).optional(),
	visibility: z.enum(COLLECTION_VISIBILITY).optional(),
});

export const updateCollectionSchema = z.object({
	name: z.string().min(1).optional(),
	description: z.string().nullable().optional(),
	type: z.enum(COLLECTION_TYPES).optional(),
	visibility: z.enum(COLLECTION_VISIBILITY).optional(),
});

export const publicCollectionWhere = () =>
	eq(collections.visibility, "public");

export const isCollectionOwner = async (
	db: Database,
	collection: { ownerType: string; ownerId: string },
	userId: string,
): Promise<boolean> => {
	if (collection.ownerType === "user") {
		return collection.ownerId === userId;
	}
	if (collection.ownerType === "workspace") {
		const [ws] = await db
			.select()
			.from(workspaces)
			.where(eq(workspaces.id, collection.ownerId))
			.limit(1);
		return ws ? ws.ownerId === userId : false;
	}
	return false;
};
