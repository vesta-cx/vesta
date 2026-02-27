/** @format */

import { describe, it, expect, beforeEach } from "vitest";
import {
	generateApiKey,
	storeApiKey,
	revokeApiKey,
	getApiKeyMeta,
} from "./keys";

const createMockKV = (): KVNamespace => {
	const store = new Map<string, { value: string; expiration?: number }>();

	return {
		get: async (key: string) => store.get(key)?.value ?? null,
		put: async (
			key: string,
			value: string,
			options?: KVNamespacePutOptions,
		) => {
			store.set(key, {
				value,
				expiration:
					options?.expirationTtl ?
						Date.now() / 1000 +
						options.expirationTtl
					:	undefined,
			});
		},
		delete: async (key: string) => {
			store.delete(key);
		},
	} as unknown as KVNamespace;
};

describe("generateApiKey", () => {
	it("starts with vesta_ prefix", () => {
		const key = generateApiKey();
		expect(key.startsWith("vesta_")).toBe(true);
	});

	it("has sufficient length (> 40 chars)", () => {
		const key = generateApiKey();
		expect(key.length).toBeGreaterThan(40);
	});

	it("generates unique keys", () => {
		const keys = new Set(
			Array.from({ length: 20 }, () => generateApiKey()),
		);
		expect(keys.size).toBe(20);
	});
});

describe("storeApiKey + getApiKeyMeta round-trip", () => {
	let kv: KVNamespace;

	beforeEach(() => {
		kv = createMockKV();
	});

	it("stores and retrieves key metadata", async () => {
		const rawKey = generateApiKey();
		await storeApiKey(kv, rawKey, {
			userId: "org_123",
			scopes: ["resources:read"],
			expiresAt: null,
		});

		const meta = await getApiKeyMeta(kv, rawKey);
		expect(meta).not.toBeNull();
		expect(meta!.userId).toBe("org_123");
		expect(meta!.scopes).toEqual(["resources:read"]);
		expect(meta!.expiresAt).toBeNull();
		expect(meta!.createdAt).toBeTruthy();
	});

	it("returns null for unknown key", async () => {
		const meta = await getApiKeyMeta(kv, "nonexistent_key");
		expect(meta).toBeNull();
	});

	it("stores key with expiration", async () => {
		const rawKey = generateApiKey();
		const futureDate = new Date(
			Date.now() + 60 * 60 * 1000,
		).toISOString();

		await storeApiKey(kv, rawKey, {
			userId: "org_456",
			scopes: ["resources:read", "resources:write"],
			expiresAt: futureDate,
		});

		const meta = await getApiKeyMeta(kv, rawKey);
		expect(meta).not.toBeNull();
		expect(meta!.expiresAt).toBe(futureDate);
	});
});

describe("revokeApiKey", () => {
	it("removes the key so getApiKeyMeta returns null", async () => {
		const kv = createMockKV();
		const rawKey = generateApiKey();

		await storeApiKey(kv, rawKey, {
			userId: "org_789",
			scopes: ["resources:read"],
			expiresAt: null,
		});

		expect(await getApiKeyMeta(kv, rawKey)).not.toBeNull();

		await revokeApiKey(kv, rawKey);

		expect(await getApiKeyMeta(kv, rawKey)).toBeNull();
	});
});
