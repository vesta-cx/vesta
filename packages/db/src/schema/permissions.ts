/** @format */

import { relations } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const PERMISSION_CATEGORIES = [
	"content",
	"resource",
	"workspace",
	"admin",
] as const;
export type PermissionCategory = (typeof PERMISSION_CATEGORIES)[number];

export const SUBJECT_TYPES = [
	"user",
	"team",
	"organization",
	"static",
] as const;
export type SubjectType = (typeof SUBJECT_TYPES)[number];

export const STATIC_SUBJECT_IDS = [
	"guest",
	"authenticated",
	"follower",
	"subscriber",
] as const;
export type StaticSubjectId = (typeof STATIC_SUBJECT_IDS)[number];

export const OBJECT_TYPES = [
	"workspace",
	"resource",
	"organization",
	"collection",
] as const;
export type ObjectType = (typeof OBJECT_TYPES)[number];

export const PERMISSION_VALUES = ["allow", "deny", "unset"] as const;
export type PermissionValue = (typeof PERMISSION_VALUES)[number];

export const COLLECTION_PERMISSION_ACTIONS = [
	"collections:read",
	"collections:write",
	"collections:delete",
] as const;
export const RESOURCE_PERMISSION_ACTIONS = [
	"resources:read",
	"resources:write",
	"resources:delete",
] as const;
export const WORKSPACE_PERMISSION_ACTIONS = [
	"workspaces:read",
	"workspaces:write",
	"workspaces:delete",
] as const;
export const ORGANIZATION_PERMISSION_ACTIONS = [
	"organizations:read",
	"organizations:write",
	"organizations:delete",
] as const;

export const permissionActions = sqliteTable("permission_actions", {
	slug: text("slug").primaryKey(),
	name: text("name").notNull(),
	description: text("description"),
	category: text("category", { enum: PERMISSION_CATEGORIES }).notNull(),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export const permissions = sqliteTable(
	"permissions",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		subjectType: text("subject_type", { enum: SUBJECT_TYPES }).notNull(),
		subjectId: text("subject_id").notNull(),
		objectType: text("object_type", { enum: OBJECT_TYPES }).notNull(),
		objectId: text("object_id").notNull(),
		action: text("action")
			.notNull()
			.references(() => permissionActions.slug),
		value: text("value", { enum: PERMISSION_VALUES })
			.notNull()
			.default("unset"),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer("updated_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => [
		index("permissions_subject_lookup_idx").on(
			table.subjectType,
			table.subjectId,
			table.objectType,
			table.objectId,
			table.action,
			table.value,
		),
		index("permissions_object_lookup_idx").on(
			table.objectType,
			table.objectId,
			table.action,
			table.value,
		),
		index("permissions_action_lookup_idx").on(
			table.action,
			table.value,
		),
	],
);

export const permissionActionsRelations = relations(
	permissionActions,
	({ many }) => ({
		permissions: many(permissions),
	}),
);

export const permissionsRelations = relations(permissions, ({ one }) => ({
	permissionAction: one(permissionActions, {
		fields: [permissions.action],
		references: [permissionActions.slug],
	}),
}));
