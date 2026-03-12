/** @format */

import { z } from "zod";
import { OWNER_TYPES, WORKSPACE_STATUSES } from "../schema/types";

export const workspaceCreateSchema = z.object({
	name: z.string().min(1),
	slug: z.string().min(1),
	description: z.string().nullable().optional(),
	ownerType: z.enum(OWNER_TYPES),
	ownerId: z.string().min(1),
	avatarUrl: z.string().url().nullable().optional(),
	bannerUrl: z.string().url().nullable().optional(),
	status: z.enum(WORKSPACE_STATUSES).optional(),
});

export const workspaceUpdateSchema = z.object({
	name: z.string().min(1).optional(),
	slug: z.string().min(1).optional(),
	description: z.string().nullable().optional(),
	avatarUrl: z.string().url().nullable().optional(),
	bannerUrl: z.string().url().nullable().optional(),
	status: z.enum(WORKSPACE_STATUSES).optional(),
});
