/** @format */

import { describe, expect, it } from "vitest";
import {
	externalLinkSubjectTypeSchema,
	scopeForSubjectType,
} from "./shared";

describe("external link subject typing", () => {
	it("accepts supported subject types", () => {
		expect(
			externalLinkSubjectTypeSchema.safeParse("resource").success,
		).toBe(true);
		expect(
			externalLinkSubjectTypeSchema.safeParse("workspace").success,
		).toBe(true);
	});

	it("rejects unsupported subject types", () => {
		expect(
			externalLinkSubjectTypeSchema.safeParse("user").success,
		).toBe(false);
	});
});

describe("scopeForSubjectType", () => {
	it("maps resource to resource scopes", () => {
		expect(scopeForSubjectType("resource", "read")).toBe(
			"resources:read",
		);
		expect(scopeForSubjectType("resource", "write")).toBe(
			"resources:write",
		);
	});

	it("maps workspace to workspace scopes", () => {
		expect(scopeForSubjectType("workspace", "read")).toBe(
			"workspaces:read",
		);
		expect(scopeForSubjectType("workspace", "write")).toBe(
			"workspaces:write",
		);
	});
});
