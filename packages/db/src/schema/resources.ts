/** @format */

import { relations } from "drizzle-orm";
import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import {
	index,
	integer,
	primaryKey,
	sqliteTable,
	text,
} from "drizzle-orm/sqlite-core";
import { posts } from "./posts";
import { resourceUrls } from "./resource-urls";
import { ENGAGEMENT_SUBJECT_TYPES } from "./engagements";
import {
	OWNER_TYPES,
	RESOURCE_TYPES,
	RESOURCE_STATUSES,
	AUTHOR_TYPES,
} from "./types";

export const resources = sqliteTable(
	"resources",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		ownerType: text("owner_type", { enum: OWNER_TYPES }).notNull(),
		ownerId: text("owner_id").notNull(),
		type: text("type", { enum: RESOURCE_TYPES }).notNull(),
		title: text("title"),
		excerpt: text("excerpt"),
		parentResourceId: text("parent_resource_id").references(
			(): AnySQLiteColumn => resources.id,
		),
		status: text("status", { enum: RESOURCE_STATUSES })
			.notNull()
			.default("UNLISTED"),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer("updated_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => [
		index("resources_owner_idx").on(
			table.ownerType,
			table.ownerId,
			table.createdAt,
		),
		index("resources_parent_created_idx").on(
			table.parentResourceId,
			table.createdAt,
		),
	],
);

export const resourceAncestors = sqliteTable(
	"resource_ancestors",
	{
		resourceId: text("resource_id")
			.notNull()
			.references(() => resources.id),
		ancestorId: text("ancestor_id")
			.notNull()
			.references(() => resources.id),
		depth: integer("depth").notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.resourceId, table.ancestorId],
		}),
		index("resource_ancestors_ancestor_depth_idx").on(
			table.ancestorId,
			table.depth,
		),
		index("resource_ancestors_resource_idx").on(table.resourceId),
	],
);

export const resourceMentions = sqliteTable(
	"resource_mentions",
	{
		resourceId: text("resource_id")
			.notNull()
			.references(() => resources.id),
		mentionedType: text("mentioned_type", {
			enum: ENGAGEMENT_SUBJECT_TYPES,
		}).notNull(),
		mentionedId: text("mentioned_id").notNull(),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => [
		primaryKey({
			columns: [
				table.resourceId,
				table.mentionedType,
				table.mentionedId,
			],
		}),
		index("resource_mentions_mentioned_idx").on(
			table.mentionedType,
			table.mentionedId,
		),
	],
);

export const resourceAuthors = sqliteTable(
	"resource_authors",
	{
		resourceId: text("resource_id")
			.notNull()
			.references(() => resources.id),
		authorType: text("author_type", {
			enum: AUTHOR_TYPES,
		}).notNull(),
		authorId: text("author_id").notNull(),
		role: text("role"),
		addedAt: integer("added_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => [
		primaryKey({
			columns: [
				table.resourceId,
				table.authorType,
				table.authorId,
			],
		}),
	],
);

export const resourcesRelations = relations(resources, ({ one, many }) => ({
	post: one(posts, {
		fields: [resources.id],
		references: [posts.resourceId],
	}),
	parent: one(resources, {
		fields: [resources.parentResourceId],
		references: [resources.id],
		relationName: "resource_parent",
	}),
	children: many(resources, {
		relationName: "resource_parent",
	}),
	authors: many(resourceAuthors),
	urls: many(resourceUrls),
	ancestors: many(resourceAncestors, {
		relationName: "ancestor_resource",
	}),
	descendants: many(resourceAncestors, {
		relationName: "ancestor_ancestor",
	}),
	mentions: many(resourceMentions),
}));

export const resourceAuthorsRelations = relations(
	resourceAuthors,
	({ one }) => ({
		resource: one(resources, {
			fields: [resourceAuthors.resourceId],
			references: [resources.id],
		}),
	}),
);

export const resourceAncestorsRelations = relations(
	resourceAncestors,
	({ one }) => ({
		resource: one(resources, {
			fields: [resourceAncestors.resourceId],
			references: [resources.id],
			relationName: "ancestor_resource",
		}),
		ancestor: one(resources, {
			fields: [resourceAncestors.ancestorId],
			references: [resources.id],
			relationName: "ancestor_ancestor",
		}),
	}),
);

export const resourceMentionsRelations = relations(
	resourceMentions,
	({ one }) => ({
		resource: one(resources, {
			fields: [resourceMentions.resourceId],
			references: [resources.id],
		}),
	}),
);
