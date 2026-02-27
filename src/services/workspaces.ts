/** @format */

import { eq } from "drizzle-orm";
import type { ListQueryConfig } from "@mia-cx/drizzle-query-factory";
import { workspaces } from "../db/schema";
import { z } from "../lib/validation";

export const workspaceListConfig: ListQueryConfig = {
	filters: {
		owner_id: { column: workspaces.ownerId },
		owner_type: { column: workspaces.ownerType },
		visibility: { column: workspaces.visibility },
		slug: { column: workspaces.slug },
	},
	sortable: {
		created_at: workspaces.createdAt,
		updated_at: workspaces.updatedAt,
		name: workspaces.name,
	},
	defaultSort: { key: "created_at", dir: "desc" },
};

export const createWorkspaceSchema = z.object({
	name: z.string().min(1),
	slug: z.string().min(1),
	description: z.string().nullable().optional(),
	ownerType: z.string().min(1),
	ownerId: z.string().min(1),
	avatarUrl: z.string().url().nullable().optional(),
	bannerUrl: z.string().url().nullable().optional(),
	visibility: z.enum(["public", "private", "unlisted"]).optional(),
});

export const updateWorkspaceSchema = z.object({
	name: z.string().min(1).optional(),
	slug: z.string().min(1).optional(),
	description: z.string().nullable().optional(),
	avatarUrl: z.string().url().nullable().optional(),
	bannerUrl: z.string().url().nullable().optional(),
	visibility: z.enum(["public", "private", "unlisted"]).optional(),
});

export const publicWorkspaceWhere = () => eq(workspaces.visibility, "public");
