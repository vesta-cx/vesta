/** @format */

import { z } from "zod";
import {
	OWNER_TYPES,
	RESOURCE_STATUSES,
	RESOURCE_TYPES,
} from "../schema/types";

export const resourceCreateSchema = z.object({
	ownerType: z.enum(OWNER_TYPES),
	ownerId: z.string().min(1),
	type: z.enum(RESOURCE_TYPES),
	title: z.string().nullable().optional(),
	excerpt: z.string().nullable().optional(),
	status: z.enum(RESOURCE_STATUSES).optional(),
});

export const resourceUpdateSchema = z.object({
	type: z.enum(RESOURCE_TYPES).optional(),
	title: z.string().nullable().optional(),
	excerpt: z.string().nullable().optional(),
	status: z.enum(RESOURCE_STATUSES).optional(),
});
