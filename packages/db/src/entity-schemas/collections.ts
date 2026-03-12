/** @format */

import { z } from "zod";
import {
	COLLECTION_OWNER_TYPES,
	COLLECTION_STATUSES,
	COLLECTION_TYPES,
} from "../schema/collections";

export const collectionCreateSchema = z.object({
	ownerType: z.enum(COLLECTION_OWNER_TYPES),
	ownerId: z.string().min(1),
	name: z.string().min(1),
	description: z.string().nullable().optional(),
	type: z.enum(COLLECTION_TYPES).optional(),
	status: z.enum(COLLECTION_STATUSES).optional(),
});

export const collectionUpdateSchema = z.object({
	name: z.string().min(1).optional(),
	description: z.string().nullable().optional(),
	type: z.enum(COLLECTION_TYPES).optional(),
	status: z.enum(COLLECTION_STATUSES).optional(),
});
