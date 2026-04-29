/** @format */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { Hono } from "hono";

const {
	authenticateSealedSession,
	createEratoAuthRuntime,
	createEratoProvisioningAdapter,
} = vi.hoisted(() => ({
	authenticateSealedSession: vi.fn(),
	createEratoAuthRuntime: vi.fn(),
	createEratoProvisioningAdapter: vi.fn(),
}));

vi.mock("./runtime", () => ({
	createEratoAuthRuntime,
	createEratoProvisioningAdapter,
}));

import { authMiddleware } from "./middleware";
import { hashApiKey } from "./helpers";
import type { ApiKeyMeta } from "./types";

type TestEnv = {
	Bindings: {
		DB: D1Database;
		KV: KVNamespace;
		WORKOS_API_KEY: string;
		WORKOS_CLIENT_ID: string;
		WORKOS_COOKIE_PASSWORD: string;
	};
	Variables: { auth: unknown };
};

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

const buildApp = (kv: KVNamespace) => {
	const app = new Hono<TestEnv>();
	app.use("*", authMiddleware);
	app.get("/test", (c) => c.json(c.get("auth")));
	return { app, kv };
};

const makeRequest = (
	app: Hono<TestEnv>,
	kv: KVNamespace,
	headers?: Record<string, string>,
) => {
	return app.request(
		"/test",
		{ headers },
		{
			DB: {} as D1Database,
			KV: kv,
			WORKOS_API_KEY: "sk_test",
			WORKOS_CLIENT_ID: "client_test",
			WORKOS_COOKIE_PASSWORD:
				"password-that-is-at-least-32-chars",
		},
	);
};

describe("auth middleware", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		createEratoAuthRuntime.mockReturnValue({
			authenticateSealedSession,
		});
		createEratoProvisioningAdapter.mockReturnValue({
			provision: vi.fn(),
		});
		authenticateSealedSession.mockResolvedValue({
			authenticated: false,
			refreshed: false,
			reason: "missing_session",
			sealedSession: null,
			session: null,
		});
	});
	describe("sealed session path", () => {
		it("sets guest auth when session auth throws", async () => {
			const warn = vi
				.spyOn(console, "warn")
				.mockImplementation(() => {});
			authenticateSealedSession.mockRejectedValue(
				new Error("WorkOS unavailable"),
			);
			const kv = createMockKV();
			const { app } = buildApp(kv);

			const res = await makeRequest(app, kv, {
				Cookie: "session=sealed_session",
			});

			expect(res.status).toBe(200);
			await expect(res.json()).resolves.toEqual({
				type: "guest",
			});
			expect(warn).toHaveBeenCalledWith(
				"Erato session authentication failed",
				expect.any(Error),
			);
			warn.mockRestore();
		});

		it("sets session auth and provisions when session cookie is valid", async () => {
			authenticateSealedSession.mockResolvedValue({
				authenticated: true,
				refreshed: false,
				reason: null,
				sealedSession: "sealed_session",
				session: {
					sessionId: "session_123",
					userId: "user_123",
					email: "mia@example.com",
					firstName: "Mia",
					lastName: "Example",
					emailVerified: true,
					profilePictureUrl: null,
					organizationId: "org_123",
					roleSlug: null,
					permissions: ["resources:read"],
					entitlements: [],
					memberships: [],
				},
			});
			const kv = createMockKV();
			const { app } = buildApp(kv);

			const res = await makeRequest(app, kv, {
				Cookie: "session=sealed_session",
			});
			expect(res.status).toBe(200);

			const body = await res.json();
			expect(body).toMatchObject({
				type: "session",
				subjectType: "user",
				subjectId: "user_123",
				scopes: ["resources:read"],
			});
			expect(authenticateSealedSession).toHaveBeenCalledWith({
				sealedSession: "sealed_session",
				resolveMemberships: true,
				provisioningAdapter: expect.any(Object),
			});
		});
	});

	describe("no key (guest path)", () => {
		it("sets guest auth when no Authorization header", async () => {
			const kv = createMockKV();
			const { app } = buildApp(kv);

			const res = await makeRequest(app, kv);
			expect(res.status).toBe(200);

			const body = await res.json();
			expect(body).toEqual({ type: "guest" });
		});

		it("sets guest auth when Authorization header has no Bearer prefix", async () => {
			const kv = createMockKV();
			const { app } = buildApp(kv);

			const res = await makeRequest(app, kv, {
				Authorization: "Basic abc123",
			});
			expect(res.status).toBe(200);

			const body = await res.json();
			expect(body).toEqual({ type: "guest" });
		});

		it("sets guest auth when Bearer token is empty", async () => {
			const kv = createMockKV();
			const { app } = buildApp(kv);

			const res = await makeRequest(app, kv, {
				Authorization: "Bearer ",
			});
			expect(res.status).toBe(200);

			const body = await res.json();
			expect(body).toEqual({ type: "guest" });
		});
	});

	describe("invalid key path", () => {
		it("returns 401 when key not found in KV", async () => {
			const kv = createMockKV();
			const { app } = buildApp(kv);

			const res = await makeRequest(app, kv, {
				Authorization: "Bearer unknown-key",
			});
			expect(res.status).toBe(401);

			const body = await res.json();
			expect(body).toEqual({ error: "Unauthorized" });
		});

		it("returns 401 when KV value is invalid JSON", async () => {
			const hash = await hashApiKey("bad-json-key");
			const kv = createMockKV({
				[`ak:${hash}`]: "not-json{{{",
			});
			const { app } = buildApp(kv);

			const res = await makeRequest(app, kv, {
				Authorization: "Bearer bad-json-key",
			});
			expect(res.status).toBe(401);
		});
	});

	describe("expired key path", () => {
		it("returns 401 when key is expired", async () => {
			const rawKey = "expired-key";
			const hash = await hashApiKey(rawKey);
			const meta: ApiKeyMeta = {
				subjectType: "organization",
				subjectId: "org_expired",
				scopes: ["resources:read"],
				createdAt: "2024-01-01T00:00:00Z",
				expiresAt: "2024-01-02T00:00:00Z",
			};
			const kv = createMockKV({
				[`ak:${hash}`]: JSON.stringify(meta),
			});
			const { app } = buildApp(kv);

			const res = await makeRequest(app, kv, {
				Authorization: `Bearer ${rawKey}`,
			});
			expect(res.status).toBe(401);
		});
	});

	describe("valid key path", () => {
		let kv: KVNamespace;
		let rawKey: string;

		beforeEach(async () => {
			rawKey = "valid-test-key";
			const hash = await hashApiKey(rawKey);
			const meta: ApiKeyMeta = {
				subjectType: "organization",
				subjectId: "org_valid",
				scopes: ["resources:read", "resources:write"],
				createdAt: new Date().toISOString(),
				expiresAt: null,
			};
			kv = createMockKV({
				[`ak:${hash}`]: JSON.stringify(meta),
			});
		});

		it("sets apikey auth context for valid key", async () => {
			const { app } = buildApp(kv);

			const res = await makeRequest(app, kv, {
				Authorization: `Bearer ${rawKey}`,
			});
			expect(res.status).toBe(200);

			const body = await res.json();
			expect(body).toEqual({
				type: "apikey",
				subjectType: "organization",
				subjectId: "org_valid",
				scopes: ["resources:read", "resources:write"],
			});
		});

		it("passes non-expired key with future expiresAt", async () => {
			const futureKey = "future-key";
			const hash = await hashApiKey(futureKey);
			const meta: ApiKeyMeta = {
				subjectType: "organization",
				subjectId: "org_future",
				scopes: ["admin"],
				createdAt: new Date().toISOString(),
				expiresAt: new Date(
					Date.now() + 365 * 24 * 60 * 60 * 1000,
				).toISOString(),
			};
			const futureKv = createMockKV({
				[`ak:${hash}`]: JSON.stringify(meta),
			});
			const { app } = buildApp(futureKv);

			const res = await makeRequest(app, futureKv, {
				Authorization: `Bearer ${futureKey}`,
			});
			expect(res.status).toBe(200);

			const body = (await res.json()) as {
				type: string;
				subjectId: string;
				scopes: string[];
			};
			expect(body.type).toBe("apikey");
			expect(body.subjectId).toBe("org_future");
			expect(body.scopes).toEqual(["admin"]);
		});
	});
});
