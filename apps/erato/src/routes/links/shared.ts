/** @format */

import type { ListQueryConfig } from "@mia-cx/drizzle-query-factory";
import type { Context } from "hono";
import { z } from "../../lib/validation";
import { externalLinks } from "../../db/schema";
import { singleError } from "../../lib/errors";
import type { Scope } from "../../auth/types";

export const externalLinkSubjectTypeSchema = z.enum(["resource", "workspace"]);
export type ExternalLinkSubjectType = z.infer<
	typeof externalLinkSubjectTypeSchema
>;

export const INVALID_SUBJECT_TYPE_MESSAGE = `Invalid subjectType. Use ${externalLinkSubjectTypeSchema.options.join(" or ")}.`;

const iconSchema = z.string().nullable().optional();

export const addExternalLinkSchema = z.object({
	name: z.string().min(1),
	url: z.string().url(),
	icon: iconSchema,
	position: z.number().int().min(0),
});

export const updateExternalLinkSchema = z.object({
	name: z.string().min(1).optional(),
	url: z.string().url().optional(),
	icon: iconSchema,
});

export const externalLinkListConfig: ListQueryConfig = {
	filters: {
		position: {
			column: externalLinks.position,
			parse: (value) =>
				z.coerce.number().int().min(0).parse(value),
		},
	},
	sortable: { position: externalLinks.position },
	defaultSort: { key: "position", dir: "asc" },
};

export const parseSubjectType = (c: Context) => {
	const parsed = externalLinkSubjectTypeSchema.safeParse(
		c.req.param("subjectType"),
	);
	if (parsed.success) return parsed.data;
	return singleError(
		c,
		422,
		INVALID_SUBJECT_TYPE_MESSAGE,
		"VALIDATION_ERROR",
		"subjectType",
	);
};

export const parsePositionParam = (c: Context) => {
	const raw = c.req.param("position");
	const position = Number(raw);
	if (Number.isInteger(position) && position >= 0) return position;
	return singleError(
		c,
		422,
		"position must be a non-negative integer",
		"VALIDATION_ERROR",
		"position",
	);
};

export const scopeForSubjectType = (
	subjectType: ExternalLinkSubjectType,
	access: "read" | "write",
): Scope => {
	return subjectType === "resource" ?
			`resources:${access}`
		:	`workspaces:${access}`;
};
