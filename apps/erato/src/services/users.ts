/** @format */

import { eq, type SQL } from "drizzle-orm";
import type { ListQueryConfig } from "@mia-cx/drizzle-query-factory";
import {
	userCreateSchema,
	userUpdateSchema,
} from "@vesta-cx/db/entity-schemas";
import { users } from "../db/schema";

export const userListConfig: ListQueryConfig = {
	filters: {
		email: { column: users.email },
		display_name: { column: users.displayName, op: "like" },
		organization_id: { column: users.organizationId },
	},
	sortable: {
		created_at: users.createdAt,
		updated_at: users.updatedAt,
		email: users.email,
	},
	defaultSort: { key: "created_at", dir: "desc" },
};

export const createUserSchema = userCreateSchema;

export const updateUserSchema = userUpdateSchema;

export const PUBLIC_USER_FIELDS = {
	workosUserId: users.workosUserId,
	displayName: users.displayName,
	avatarUrl: users.avatarUrl,
	bio: users.bio,
	createdAt: users.createdAt,
} as const;

export const publicProfileWhere = (): SQL | undefined => undefined;
