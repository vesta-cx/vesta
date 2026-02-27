/** @format */

import { eq, type SQL } from "drizzle-orm";
import type { ListQueryConfig } from "@mia-cx/drizzle-query-factory";
import { users } from "../db/schema";
import { z } from "../lib/validation";

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

export const createUserSchema = z.object({
	workosUserId: z.string().min(1),
	email: z.string().email(),
	displayName: z.string().nullable().optional(),
	avatarUrl: z.string().url().nullable().optional(),
	bio: z.string().nullable().optional(),
	organizationId: z.string().min(1),
});

export const updateUserSchema = z.object({
	email: z.string().email().optional(),
	displayName: z.string().nullable().optional(),
	avatarUrl: z.string().url().nullable().optional(),
	bio: z.string().nullable().optional(),
	themeConfig: z
		.object({
			colors: z.record(z.string()).optional(),
			fonts: z.record(z.string()).optional(),
			layout: z.string().optional(),
		})
		.nullable()
		.optional(),
});

export const PUBLIC_USER_FIELDS = {
	workosUserId: users.workosUserId,
	displayName: users.displayName,
	avatarUrl: users.avatarUrl,
	bio: users.bio,
	createdAt: users.createdAt,
} as const;

export const publicProfileWhere = (): SQL | undefined => undefined;
