/** @format */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import app from "./app";

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

const env = (entries: Record<string, string> = {}) => ({
	SHORT_LINKS: createMockKV(entries),
	CANONICAL_ORIGIN: "https://vesta.cx",
});

describe("shortener app", () => {
	beforeEach(() => {
		vi.spyOn(console, "info").mockImplementation(() => undefined);
		vi.spyOn(console, "warn").mockImplementation(() => undefined);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns health status without hitting KV", async () => {
		const response = await app.request("/health", {}, env());
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ status: "ok" });
	});

	it("redirects a known slug with a temporary redirect", async () => {
		const response = await app.request(
			"/daybreak?utm_source=instagram",
			{},
			env({
				daybreak: JSON.stringify({
					destinationUrl:
						"https://vesta.cx/daybreak/new-release",
					targetType: "release",
					targetId: "rel_123",
					workspaceSlug: "daybreak",
					updatedAt: "2026-03-23T00:00:00.000Z",
				}),
			}),
		);

		expect(response.status).toBe(302);
		expect(response.headers.get("location")).toBe(
			"https://vesta.cx/daybreak/new-release?utm_source=instagram",
		);
	});

	it("returns 404 for a missing slug", async () => {
		const response = await app.request("/missing", {}, env());
		expect(response.status).toBe(404);
		expect(await response.text()).toBe("Short URL not found");
	});

	it("returns 404 when the record points off-origin", async () => {
		const response = await app.request(
			"/daybreak",
			{},
			env({
				daybreak: JSON.stringify({
					destinationUrl:
						"https://example.com/daybreak/new-release",
					targetType: "url",
					updatedAt: "2026-03-23T00:00:00.000Z",
				}),
			}),
		);

		expect(response.status).toBe(404);
		expect(await response.text()).toBe("Short URL not found");
	});

	it("returns 404 for reserved slug probes", async () => {
		const response = await app.request(
			"/favicon.ico",
			{},
			env({
				"favicon.ico": JSON.stringify({
					destinationUrl:
						"https://vesta.cx/daybreak/new-release",
					targetType: "url",
					updatedAt: "2026-03-23T00:00:00.000Z",
				}),
			}),
		);

		expect(response.status).toBe(404);
		expect(await response.text()).toBe("Short URL not found");
	});
});
