/** @format */

import { eq } from "drizzle-orm";
import { organizations } from "../db/schema";
import { z } from "../lib/validation";
import type { WorkOSOrganization } from "./workos";
import type { Database } from "../db";

export const createOrganizationSchema = z.object({
	name: z.string().min(1),
	avatarUrl: z.string().url().nullable().optional(),
	bannerUrl: z.string().url().nullable().optional(),
	themeConfig: z
		.object({
			colors: z.record(z.string()).optional(),
			fonts: z.record(z.string()).optional(),
			layout: z.string().optional(),
		})
		.nullable()
		.optional(),
});

export const updateOrganizationSchema = z.object({
	name: z.string().min(1).optional(),
	avatarUrl: z.string().url().nullable().optional(),
	bannerUrl: z.string().url().nullable().optional(),
	themeConfig: z
		.object({
			colors: z.record(z.string()).optional(),
			fonts: z.record(z.string()).optional(),
			layout: z.string().optional(),
		})
		.nullable()
		.optional(),
});

const WORKOS_FIELDS = new Set(["name"]);

export const splitUpdateFields = (
	data: Record<string, unknown>,
): {
	workos: Record<string, unknown>;
	local: Record<string, unknown>;
} => {
	const workos: Record<string, unknown> = {};
	const local: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(data)) {
		if (value === undefined) continue;
		if (WORKOS_FIELDS.has(key)) {
			workos[key] = value;
		} else {
			local[key] = value;
		}
	}
	return { workos, local };
};

export const mergeOrgResponse = (
	workosOrg: WorkOSOrganization,
	extension?: typeof organizations.$inferSelect | null,
) => ({
	id: workosOrg.id,
	name: workosOrg.name,
	avatarUrl: extension?.avatarUrl ?? null,
	bannerUrl: extension?.bannerUrl ?? null,
	themeConfig: extension?.themeConfig ?? null,
	createdAt: workosOrg.created_at,
	updatedAt: workosOrg.updated_at,
});

export const getOrCreateExtension = async (
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
