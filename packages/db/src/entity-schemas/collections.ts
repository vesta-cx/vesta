/** @format */

import { z } from "zod";
import {
	COLLECTION_KINDS,
	COLLECTION_OWNER_TYPES,
	COLLECTION_STATUSES,
	COLLECTION_TYPES,
} from "../schema/collections";

const enforceTypeKindConsistency = (
	data: { type?: (typeof COLLECTION_TYPES)[number]; kind?: (typeof COLLECTION_KINDS)[number] | null },
	ctx: z.RefinementCtx,
) => {
	if (data.type === "manual" && data.kind) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ["kind"],
			message: "kind must be omitted for manual collections",
		});
	}
	if ((data.type === "auto" || data.kind) && !data.kind) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ["kind"],
			message: "kind is required for auto collections",
		});
	}
};

export const collectionCreateSchema = z
	.object({
		ownerType: z.enum(COLLECTION_OWNER_TYPES),
		ownerId: z.string().min(1),
		name: z.string().min(1),
		description: z.string().nullable().optional(),
		type: z.enum(COLLECTION_TYPES).optional(),
		kind: z.enum(COLLECTION_KINDS).nullable().optional(),
		status: z.enum(COLLECTION_STATUSES).optional(),
	})
	.superRefine((input, ctx) => {
		const type = input.type ?? "manual";
		enforceTypeKindConsistency(
			{
				type,
				kind: input.kind ?? null,
			},
			ctx,
		);
	});

export const collectionUpdateSchema = z
	.object({
		name: z.string().min(1).optional(),
		description: z.string().nullable().optional(),
		type: z.enum(COLLECTION_TYPES).optional(),
		kind: z.enum(COLLECTION_KINDS).nullable().optional(),
		status: z.enum(COLLECTION_STATUSES).optional(),
	})
	.superRefine((input, ctx) => {
		if (input.type === undefined && input.kind === undefined) return;
		enforceTypeKindConsistency(
			{
				type: input.type,
				kind: input.kind ?? null,
			},
			ctx,
		);
	});
