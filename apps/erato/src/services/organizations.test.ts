/** @format */

import { describe, it, expect } from "vitest";
import {
	createOrganizationSchema,
	updateOrganizationSchema,
	splitUpdateFields,
	mergeOrgResponse,
} from "./organizations";
import type { WorkOSOrganization } from "./workos";

const mockWorkOSOrg: WorkOSOrganization = {
	id: "org_01",
	name: "Test Org",
	created_at: "2025-01-01T00:00:00Z",
	updated_at: "2025-06-01T00:00:00Z",
	object: "organization",
};

describe("splitUpdateFields", () => {
	it("separates WorkOS-owned fields from local fields", () => {
		const result = splitUpdateFields({
			name: "New Name",
			avatarUrl: "https://example.com/avatar.png",
			bannerUrl: "https://example.com/banner.png",
		});
		expect(result.workos).toEqual({ name: "New Name" });
		expect(result.local).toEqual({
			avatarUrl: "https://example.com/avatar.png",
			bannerUrl: "https://example.com/banner.png",
		});
	});

	it("omits undefined values", () => {
		const result = splitUpdateFields({
			name: undefined,
			avatarUrl: "https://example.com/a.png",
		});
		expect(result.workos).toEqual({});
		expect(result.local).toEqual({
			avatarUrl: "https://example.com/a.png",
		});
	});

	it("handles null values as local writes", () => {
		const result = splitUpdateFields({
			avatarUrl: null,
			bannerUrl: null,
		});
		expect(result.workos).toEqual({});
		expect(result.local).toEqual({
			avatarUrl: null,
			bannerUrl: null,
		});
	});

	it("returns empty objects when nothing is provided", () => {
		const result = splitUpdateFields({});
		expect(result.workos).toEqual({});
		expect(result.local).toEqual({});
	});
});

describe("mergeOrgResponse", () => {
	it("flattens WorkOS org + extension into a single object", () => {
		const extension = {
			workosOrgId: "org_01",
			avatarUrl: "https://example.com/avatar.png",
			bannerUrl: "https://example.com/banner.png",
			themeConfig: { colors: { primary: "blue" } },
		};
		const merged = mergeOrgResponse(mockWorkOSOrg, extension);

		expect(merged).toEqual({
			id: "org_01",
			name: "Test Org",
			avatarUrl: "https://example.com/avatar.png",
			bannerUrl: "https://example.com/banner.png",
			themeConfig: { colors: { primary: "blue" } },
			createdAt: "2025-01-01T00:00:00Z",
			updatedAt: "2025-06-01T00:00:00Z",
		});
	});

	it("returns null fields when no extension exists", () => {
		const merged = mergeOrgResponse(mockWorkOSOrg, null);

		expect(merged.avatarUrl).toBeNull();
		expect(merged.bannerUrl).toBeNull();
		expect(merged.themeConfig).toBeNull();
		expect(merged.name).toBe("Test Org");
	});

	it("returns null fields when extension is undefined", () => {
		const merged = mergeOrgResponse(mockWorkOSOrg);

		expect(merged.avatarUrl).toBeNull();
		expect(merged.bannerUrl).toBeNull();
		expect(merged.themeConfig).toBeNull();
	});
});

describe("createOrganizationSchema", () => {
	it("validates a valid create payload", () => {
		const result = createOrganizationSchema.safeParse({
			name: "My Org",
			avatarUrl: "https://example.com/avatar.png",
		});
		expect(result.success).toBe(true);
	});

	it("requires name", () => {
		const result = createOrganizationSchema.safeParse({});
		expect(result.success).toBe(false);
	});

	it("rejects invalid avatar URL", () => {
		const result = createOrganizationSchema.safeParse({
			name: "My Org",
			avatarUrl: "not-a-url",
		});
		expect(result.success).toBe(false);
	});

	it("allows null optional fields", () => {
		const result = createOrganizationSchema.safeParse({
			name: "My Org",
			avatarUrl: null,
			bannerUrl: null,
			themeConfig: null,
		});
		expect(result.success).toBe(true);
	});
});

describe("updateOrganizationSchema", () => {
	it("allows partial updates", () => {
		const result = updateOrganizationSchema.safeParse({
			avatarUrl: "https://example.com/new.png",
		});
		expect(result.success).toBe(true);
	});

	it("allows updating name only", () => {
		const result = updateOrganizationSchema.safeParse({
			name: "Updated Org",
		});
		expect(result.success).toBe(true);
	});

	it("allows empty object", () => {
		const result = updateOrganizationSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it("validates themeConfig structure", () => {
		const result = updateOrganizationSchema.safeParse({
			themeConfig: {
				colors: { primary: "red" },
				fonts: { heading: "Inter" },
				layout: "wide",
			},
		});
		expect(result.success).toBe(true);
	});
});
