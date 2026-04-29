/** @format */

import { and, eq, exists, or, sql, type SQL } from "drizzle-orm";
import type { AnyColumn } from "drizzle-orm";
import type { ListQueryConfig } from "@mia-cx/drizzle-query-factory";
export {
	collectionCreateSchema as createCollectionSchema,
	collectionUpdateSchema as updateCollectionSchema,
} from "@vesta-cx/db/entity-schemas";
import { hasScope } from "../auth/helpers";
import { ADMIN_SCOPE, type AuthContext } from "../auth/types";
import type { Database } from "../db";
import {
	COLLECTION_ITEM_TYPES,
	COLLECTION_PERMISSION_ACTIONS,
	COLLECTION_STATUSES,
	collections,
	collectionItemFilters,
	collectionItems,
	ENGAGEMENT_FILTER_ACTIONS,
	permissions,
	workspaces,
	type CollectionOwnerType,
} from "../db/schema";
import { z } from "../lib/validation";

const DIRECT_OWNER_SUBJECT_TYPES = ["user", "workspace"] as const;
const PERMISSION_SUBJECT_TYPES = ["user", "organization"] as const;
const MAX_FILTER_ITEMS = 200;

export const AUTO_COLLECTION_ADMIN_MESSAGE =
	"Auto collections are server-managed. Admin scope is required.";
export const LISTED_COLLECTION_STATUS = COLLECTION_STATUSES[0];
export const COLLECTION_READ_ACTION =
	"collections:read" satisfies (typeof COLLECTION_PERMISSION_ACTIONS)[number];
export const COLLECTION_PERMISSION_OBJECT_TYPE = "collection" as const;

export const collectionListConfig: ListQueryConfig = {
	filters: {
		owner_id: { column: collections.ownerId },
		owner_type: { column: collections.ownerType },
		type: { column: collections.type },
		kind: { column: collections.kind },
		status: { column: collections.status },
	},
	sortable: {
		created_at: collections.createdAt,
		updated_at: collections.updatedAt,
		name: collections.name,
	},
	defaultSort: { key: "created_at", dir: "desc" },
};

export const collectionItemListConfig: ListQueryConfig = {
	filters: {
		item_type: { column: collectionItems.itemType },
		item_id: { column: collectionItems.itemId },
		position: {
			column: collectionItems.position,
			parse: (value) => Number(value),
		},
	},
	sortable: {
		position: collectionItems.position,
		item_id: collectionItems.itemId,
	},
	defaultSort: { key: "position", dir: "asc" },
};

export const collectionFilterListConfig: ListQueryConfig = {
	filters: {
		item_type: { column: collectionItemFilters.itemType },
		item_id: { column: collectionItemFilters.itemId },
		engagement_action: {
			column: collectionItemFilters.engagementAction,
		},
		is_visible: {
			column: collectionItemFilters.isVisible,
			parse: (value) => value === "true",
		},
	},
	sortable: {
		item_type: collectionItemFilters.itemType,
		engagement_action: collectionItemFilters.engagementAction,
	},
	defaultSort: { key: "item_type", dir: "asc" },
};

export const addCollectionItemSchema = z.object({
	itemType: z.enum(COLLECTION_ITEM_TYPES),
	itemId: z.string().min(1),
	position: z.number().int().optional(),
});

export const collectionItemTypeSchema = z.enum(COLLECTION_ITEM_TYPES);

const filterItemSchema = z.object({
	itemType: z.enum(COLLECTION_ITEM_TYPES),
	itemId: z.string().nullable().optional(),
	engagementAction: z.enum(ENGAGEMENT_FILTER_ACTIONS),
	isVisible: z.boolean(),
});

export const updateCollectionFiltersSchema = z
	.array(filterItemSchema)
	.max(MAX_FILTER_ITEMS);

export const listedCollectionWhere = eq(
	collections.status,
	LISTED_COLLECTION_STATUS,
);

export const isAutoCollection = (collection: {
	type: (typeof collections.$inferSelect)["type"];
}) => collection.type === "auto";

const isDirectOwnerSubject = (
	auth: AuthContext,
): auth is Extract<AuthContext, { subjectType: "user" | "workspace" }> =>
	auth.type !== "guest" &&
	(DIRECT_OWNER_SUBJECT_TYPES as readonly string[]).includes(
		auth.subjectType,
	);

const isPermissionSubject = (
	auth: AuthContext,
): auth is Extract<AuthContext, { subjectType: "user" | "organization" }> =>
	auth.type !== "guest" &&
	(PERMISSION_SUBJECT_TYPES as readonly string[]).includes(
		auth.subjectType,
	);

export const collectionOwnerWhere = (
	db: Database,
	auth: AuthContext,
): SQL | undefined => {
	if (auth.type === "guest") return undefined;
	const directOwnerWhere =
		isDirectOwnerSubject(auth) ?
			and(
				eq(collections.ownerType, auth.subjectType),
				eq(collections.ownerId, auth.subjectId),
			)
		:	undefined;
	const ownedWorkspaceWhere =
		auth.subjectType === "user" ?
			and(
				eq(collections.ownerType, "workspace"),
				exists(
					db
						.select({ id: workspaces.id })
						.from(workspaces)
						.where(
							and(
								eq(
									workspaces.id,
									collections.ownerId,
								),
								eq(
									workspaces.ownerId,
									auth.subjectId,
								),
							),
						),
				),
			)
		:	undefined;

	const ownerBranches = [directOwnerWhere, ownedWorkspaceWhere].filter(
		(branch): branch is SQL => branch !== undefined,
	);
	return or(...ownerBranches);
};

export const collectionAccessWhere = (
	db: Database,
	auth: AuthContext,
	objectId: string | AnyColumn,
): SQL => {
	const ownerWhere = collectionOwnerWhere(db, auth);
	const explicitAllowWhere =
		isPermissionSubject(auth) ?
			exists(
				db
					.select({ id: permissions.id })
					.from(permissions)
					.where(
						and(
							eq(
								permissions.subjectType,
								auth.subjectType,
							),
							eq(
								permissions.subjectId,
								auth.subjectId,
							),
							eq(
								permissions.objectType,
								COLLECTION_PERMISSION_OBJECT_TYPE,
							),
							eq(
								permissions.objectId,
								objectId,
							),
							eq(
								permissions.action,
								COLLECTION_READ_ACTION,
							),
							eq(
								permissions.value,
								"allow",
							),
						),
					),
			)
		:	undefined;

	const accessBranches = [
		listedCollectionWhere,
		explicitAllowWhere,
		ownerWhere,
	].filter((branch): branch is SQL => branch !== undefined);

	return or(...accessBranches) ?? listedCollectionWhere;
};

export const canReadCollection = async (
	db: Database,
	auth: AuthContext,
	id: string,
): Promise<boolean> => {
	const where =
		hasScope(auth, ADMIN_SCOPE) ?
			eq(collections.id, id)
		:	and(
				eq(collections.id, id),
				collectionAccessWhere(db, auth, id),
			);
	const [collection] = await db
		.select({ id: collections.id })
		.from(collections)
		.where(where)
		.limit(1);
	return Boolean(collection);
};

export const collectionMutationWhere = (
	db: Database,
	auth: AuthContext,
	id: string,
): SQL => {
	if (hasScope(auth, ADMIN_SCOPE)) return eq(collections.id, id);
	const ownerWhere = collectionOwnerWhere(db, auth);
	return ownerWhere ? and(eq(collections.id, id), ownerWhere) : sql`0`;
};

export const isCollectionOwner = async (
	db: Database,
	collection: { ownerType: CollectionOwnerType; ownerId: string },
	userId: string,
): Promise<boolean> => {
	if (collection.ownerType === "user")
		return collection.ownerId === userId;
	const [ws] = await db
		.select({ ownerId: workspaces.ownerId })
		.from(workspaces)
		.where(eq(workspaces.id, collection.ownerId))
		.limit(1);
	return ws ? ws.ownerId === userId : false;
};
