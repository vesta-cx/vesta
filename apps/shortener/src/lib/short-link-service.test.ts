/** @format */

import { describe, expect, it } from "vitest";
import {
	buildRedirectLocation,
	normalizeSlug,
	parseShortLinkRecord,
	resolveShortLink,
	type ShortLinkRecord,
} from "./short-link-service";

const createMockKV = (entries: Record<string, string> = {}): KVNamespace => {
	const store = new Map(Object.entries(entries));
	return {
		get: async (key: string) => store.get(key) ?? null,
		put: async (key: string, value: string) => {
			store.set(key, value);
		},
		delete: async (key: string) => {
			store.delete(key);
		},
	} as unknown as KVNamespace;
};

const validRecord: ShortLinkRecord = {
	destinationUrl: "https://vesta.cx/daybreak/new-release",
	targetType: "release",
	targetId: "rel_123",
	workspaceSlug: "daybreak",
	updatedAt: "2026-03-23T00:00:00.000Z",
};

describe("normalizeSlug", () => {
	it("normalizes case and surrounding whitespace", () => {
		expect(normalizeSlug("  DayBreak-2026  ")).toBe(
			"daybreak-2026",
		);
	});

	it("rejects invalid slug characters", () => {
		expect(normalizeSlug("bad/slug")).toBeNull();
		expect(normalizeSlug("bad slug")).toBeNull();
	});
});

describe("parseShortLinkRecord", () => {
	it("accepts a valid structured record", () => {
		const result = parseShortLinkRecord(
			JSON.stringify(validRecord),
		);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.targetType).toBe("release");
		}
	});

	it("rejects invalid JSON payloads", () => {
		const result = parseShortLinkRecord("{not-json");
		expect(result.success).toBe(false);
	});
});

describe("buildRedirectLocation", () => {
	it("forwards query params onto the canonical destination", () => {
		const result = buildRedirectLocation(
			validRecord,
			"https://vst.cx/daybreak?utm_source=instagram",
			"https://vesta.cx",
		);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.location).toBe(
				"https://vesta.cx/daybreak/new-release?utm_source=instagram",
			);
		}
	});

	it("rejects non-canonical destinations", () => {
		const result = buildRedirectLocation(
			{
				...validRecord,
				destinationUrl:
					"https://example.com/daybreak/new-release",
			},
			"https://vst.cx/daybreak",
			"https://vesta.cx",
		);
		expect(result.success).toBe(false);
	});

	it("rejects invalid canonical origins without throwing", () => {
		expect(() =>
			buildRedirectLocation(
				validRecord,
				"https://vst.cx/daybreak",
				"vesta.cx",
			),
		).not.toThrow();

		const result = buildRedirectLocation(
			validRecord,
			"https://vst.cx/daybreak",
			"vesta.cx",
		);

		expect(result).toEqual({
			success: false,
			error: "Invalid URL",
		});
	});
});

describe("resolveShortLink", () => {
	it("resolves a stored slug to a redirect", async () => {
		const kv = createMockKV({
			daybreak: JSON.stringify(validRecord),
		});

		const result = await resolveShortLink({
			slug: "DayBreak",
			kv,
			requestUrl: "https://vst.cx/daybreak",
			canonicalOrigin: "https://vesta.cx",
		});

		expect(result).toMatchObject({
			type: "redirect",
			slug: "daybreak",
			location: "https://vesta.cx/daybreak/new-release",
		});
	});

	it("marks reserved slugs as not found", async () => {
		const kv = createMockKV({
			health: JSON.stringify(validRecord),
		});

		const result = await resolveShortLink({
			slug: "health",
			kv,
			requestUrl: "https://vst.cx/health",
			canonicalOrigin: "https://vesta.cx",
		});

		expect(result).toEqual({
			type: "not_found",
			slug: "health",
			reason: "reserved_slug",
		});
	});

	it("treats crawler probes as reserved paths", async () => {
		const kv = createMockKV();

		const result = await resolveShortLink({
			slug: "favicon.ico",
			kv,
			requestUrl: "https://vst.cx/favicon.ico",
			canonicalOrigin: "https://vesta.cx",
		});

		expect(result).toEqual({
			type: "not_found",
			slug: "favicon.ico",
			reason: "reserved_slug",
		});
	});

	it("marks invalid record payloads as not found", async () => {
		const kv = createMockKV({
			daybreak: "not-json",
		});

		const result = await resolveShortLink({
			slug: "daybreak",
			kv,
			requestUrl: "https://vst.cx/daybreak",
			canonicalOrigin: "https://vesta.cx",
		});

		expect(result.type).toBe("not_found");
		if (result.type === "not_found") {
			expect(result.reason).toBe("invalid_record");
		}
	});
});
