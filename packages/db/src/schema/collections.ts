/** @format */

import { relations } from "drizzle-orm";
import {
	integer,
	primaryKey,
	sqliteTable,
	text,
} from "drizzle-orm/sqlite-core";
import { ENGAGEMENT_ACTIONS } from "./engagements";

export const COLLECTION_OWNER_TYPES = ["user", "workspace"] as const;
export type CollectionOwnerType = (typeof COLLECTION_OWNER_TYPES)[number];

export const COLLECTION_TYPES = [
	"resources",
	"following",
	"reposts",
	"likes",
	"comments",
	"bookmarks",
	"subscriptions",
	"notifications",
	"custom",
] as const;
export type CollectionType = (typeof COLLECTION_TYPES)[number];

export const COLLECTION_STATUSES = ["LISTED", "UNLISTED"] as const;
export type CollectionStatus = (typeof COLLECTION_STATUSES)[number];

export const COLLECTION_ITEM_TYPES = [
	"resource",
	"user",
	"workspace",
	"collection",
] as const;
export type CollectionItemType = (typeof COLLECTION_ITEM_TYPES)[number];

export const ENGAGEMENT_FILTER_ACTIONS = [
	...ENGAGEMENT_ACTIONS,
	"all",
] as const;
export type EngagementFilterAction = (typeof ENGAGEMENT_FILTER_ACTIONS)[number];

export const collections = sqliteTable("collections", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	ownerType: text("owner_type", {
		enum: COLLECTION_OWNER_TYPES,
	}).notNull(),
	ownerId: text("owner_id").notNull(),
	name: text("name").notNull(),
	description: text("description"),
	type: text("type", { enum: COLLECTION_TYPES })
		.notNull()
		.default("custom"),
	isProtected: integer("is_protected", { mode: "boolean" })
		.notNull()
		.default(false),
	status: text("status", { enum: COLLECTION_STATUSES })
		.notNull()
		.default("LISTED"),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export const collectionItems = sqliteTable(
	"collection_items",
	{
		collectionId: text("collection_id")
			.notNull()
			.references(() => collections.id),
		itemType: text("item_type", {
			enum: COLLECTION_ITEM_TYPES,
		}).notNull(),
		itemId: text("item_id").notNull(),
		addedAt: integer("added_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
		position: integer("position"),
	},
	(table) => [
		primaryKey({
			columns: [
				table.collectionId,
				table.itemType,
				table.itemId,
			],
		}),
	],
);

export const collectionItemFilters = sqliteTable(
	"collection_item_filters",
	{
		collectionId: text("collection_id")
			.notNull()
			.references(() => collections.id),
		itemType: text("item_type", {
			enum: COLLECTION_ITEM_TYPES,
		}).notNull(),
		itemId: text("item_id"),
		engagementAction: text("engagement_action", {
			enum: ENGAGEMENT_FILTER_ACTIONS,
		}).notNull(),
		isVisible: integer("is_visible", { mode: "boolean" })
			.notNull()
			.default(true),
	},
	(table) => [
		primaryKey({
			columns: [
				table.collectionId,
				table.itemType,
				table.itemId,
				table.engagementAction,
			],
		}),
	],
);

export const collectionsRelations = relations(collections, ({ many }) => ({
	items: many(collectionItems),
	itemFilters: many(collectionItemFilters),
}));

export const collectionItemsRelations = relations(
	collectionItems,
	({ one }) => ({
		collection: one(collections, {
			fields: [collectionItems.collectionId],
			references: [collections.id],
		}),
	}),
);

export const collectionItemFiltersRelations = relations(
	collectionItemFilters,
	({ one }) => ({
		collection: one(collections, {
			fields: [collectionItemFilters.collectionId],
			references: [collections.id],
		}),
	}),
);
