/** @format */

import type { ListQueryConfig } from "@mia-cx/drizzle-query-factory";
import { z } from "../../lib/validation";
import { externalLinks } from "../../db/schema";

export const externalLinkSubjectTypeSchema = z.enum([
	"resource",
	"workspace",
]);
export type ExternalLinkSubjectType = z.infer<
	typeof externalLinkSubjectTypeSchema
>;

export const addExternalLinkSchema = z.object({
	name: z.string().min(1),
	url: z.string().url(),
	icon: z.string().nullable().optional(),
	position: z.number().int().min(0),
});

export const updateExternalLinkSchema = z.object({
	name: z.string().min(1).optional(),
	url: z.string().url().optional(),
	icon: z.string().nullable().optional(),
});

export const externalLinkListConfig: ListQueryConfig = {
	filters: {
		position: {
			column: externalLinks.position,
			parse: (value) => Number(value),
		},
	},
	sortable: { position: externalLinks.position },
	defaultSort: { key: "position", dir: "asc" },
};

export const scopeForSubjectType = (
	subjectType: ExternalLinkSubjectType,
	access: "read" | "write",
) => {
	return subjectType === "resource" ?
			`resources:${access}`
		:	`workspaces:${access}`;
};
