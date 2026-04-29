/** @format */

import { eq } from "drizzle-orm";
import { organizations } from "../db/schema";
import { z } from "../lib/validation";
import type { AuthOrganization } from "@vesta-cx/auth";
import type { Database } from "../db";

const themeConfigSchema = z
	.object({
		colors: z.record(z.string()).optional(),
		fonts: z.record(z.string()).optional(),
		layout: z.string().optional(),
	})
	.nullable()
	.optional();

export const createOrganizationSchema = z.object({
	name: z.string().min(1),
	avatarUrl: z.string().url().nullable().optional(),
	bannerUrl: z.string().url().nullable().optional(),
	themeConfig: themeConfigSchema,
});

export const updateOrganizationSchema = z.object({
	name: z.string().min(1).optional(),
	avatarUrl: z.string().url().nullable().optional(),
	bannerUrl: z.string().url().nullable().optional(),
	themeConfig: themeConfigSchema,
});

const WORKOS_FIELDS = new Set(["name"]);

export const splitUpdateFields = (
	data: Record<string, unknown>,
): {
	workos: Record<string, unknown>;
	local: Partial<typeof organizations.$inferInsert>;
} => {
	const workos: Record<string, unknown> = {};
	const local: Partial<typeof organizations.$inferInsert> = {};
	for (const [key, value] of Object.entries(data)) {
		if (value === undefined) continue;
		if (WORKOS_FIELDS.has(key)) {
			workos[key] = value;
		} else {
			local[key as keyof typeof local] = value as never;
		}
	}
	return { workos, local };
};

export const mergeOrgResponse = (
	workosOrg: AuthOrganization,
	extension?: typeof organizations.$inferSelect | null,
) => ({
	id: workosOrg.id,
	name: workosOrg.name,
	avatarUrl: extension?.avatarUrl ?? null,
	bannerUrl: extension?.bannerUrl ?? null,
	themeConfig: extension?.themeConfig ?? null,
	createdAt: workosOrg.createdAt,
	updatedAt: workosOrg.updatedAt,
});

export const getOrganizationExtension = async (
	db: Database,
	workosOrgId: string,
) => {
	const [existing] = await db
		.select()
		.from(organizations)
		.where(eq(organizations.workosOrgId, workosOrgId))
		.limit(1);
	return existing ?? null;
};
