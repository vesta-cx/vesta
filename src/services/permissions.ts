import type { ListQueryConfig } from "@mia-cx/drizzle-query-factory";
import {
	permissions,
	permissionActions,
	SUBJECT_TYPES,
	OBJECT_TYPES,
	PERMISSION_VALUES,
	PERMISSION_CATEGORIES,
} from "../db/schema";
import { z } from "../lib/validation";

export const permissionListConfig: ListQueryConfig = {
	filters: {
		subject_type: { column: permissions.subjectType },
		subject_id: { column: permissions.subjectId },
		object_type: { column: permissions.objectType },
		object_id: { column: permissions.objectId },
		action: { column: permissions.action },
		value: { column: permissions.value },
	},
	sortable: {
		created_at: permissions.createdAt,
		updated_at: permissions.updatedAt,
	},
	defaultSort: { key: "created_at", dir: "desc" },
};

export const permissionActionListConfig: ListQueryConfig = {
	filters: {
		category: { column: permissionActions.category },
		name: { column: permissionActions.name, op: "like" },
	},
	sortable: {
		created_at: permissionActions.createdAt,
		name: permissionActions.name,
	},
	defaultSort: { key: "created_at", dir: "desc" },
};

export const createPermissionSchema = z.object({
	subjectType: z.enum(SUBJECT_TYPES),
	subjectId: z.string().min(1),
	objectType: z.enum(OBJECT_TYPES),
	objectId: z.string().min(1),
	action: z.string().min(1),
	value: z.enum(PERMISSION_VALUES).optional(),
});

export const updatePermissionSchema = z.object({
	value: z.enum(PERMISSION_VALUES),
});

export const createPermissionActionSchema = z.object({
	slug: z.string().min(1),
	name: z.string().min(1),
	description: z.string().nullable().optional(),
	category: z.enum(PERMISSION_CATEGORIES),
});

export const updatePermissionActionSchema = z.object({
	name: z.string().min(1).optional(),
	description: z.string().nullable().optional(),
	category: z.enum(PERMISSION_CATEGORIES).optional(),
});
