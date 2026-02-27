/** @format */

import { eq } from "drizzle-orm";
import type { ListQueryConfig } from "@mia-cx/drizzle-query-factory";
import {
	collectionCreateSchema,
	collectionUpdateSchema,
} from "@vesta-cx/db/entity-schemas";
import type { Database } from "../db";
import { collections, workspaces } from "../db/schema";

export const collectionListConfig: ListQueryConfig = {
	filters: {
		owner_id: { column: collections.ownerId },
		owner_type: { column: collections.ownerType },
		type: { column: collections.type },
		status: { column: collections.status },
	},
	sortable: {
		created_at: collections.createdAt,
		updated_at: collections.updatedAt,
		name: collections.name,
	},
	defaultSort: { key: "created_at", dir: "desc" },
};

export const createCollectionSchema = collectionCreateSchema;

export const updateCollectionSchema = collectionUpdateSchema;

export const listedCollectionWhere = () => eq(collections.status, "LISTED");

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
