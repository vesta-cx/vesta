import { describe, it, expect, vi, beforeEach } from "vitest";
import {
	getAuthorizationUrl,
	authenticateWithCode,
	createSession,
	getSession,
	clearSession,
	type AuthSession,
} from "../../src/auth/index.js";

// ── getAuthorizationUrl ──────────────────────────────────────────────────────

describe("getAuthorizationUrl", () => {
	it("should build a User Management authorize URL with required params", () => {
		expect.assertions(5);

		const url = getAuthorizationUrl({
			clientId: "client_test",
			redirectUri: "http://localhost:5173/auth/callback",
			organizationId: "org_test",
		});

		const parsed = new URL(url);
		expect(parsed.origin).toBe("https://api.workos.com");
		expect(parsed.pathname).toBe("/user_management/authorize");
		expect(parsed.searchParams.get("client_id")).toBe("client_test");
		expect(parsed.searchParams.get("organization_id")).toBe("org_test");
		expect(parsed.searchParams.get("provider")).toBe("authkit");
	});

	it("should include state param when provided", () => {
		expect.assertions(1);

		const url = getAuthorizationUrl({
			clientId: "client_test",
			redirectUri: "http://localhost:5173/auth/callback",
			organizationId: "org_test",
			state: "csrf_token_123",
		});

		const parsed = new URL(url);
		expect(parsed.searchParams.get("state")).toBe("csrf_token_123");
	});

	it("should not include state param when omitted", () => {
		expect.assertions(1);

		const url = getAuthorizationUrl({
			clientId: "client_test",
			redirectUri: "http://localhost:5173/auth/callback",
			organizationId: "org_test",
		});

		const parsed = new URL(url);
		expect(parsed.searchParams.has("state")).toBe(false);
	});
});

// ── authenticateWithCode ─────────────────────────────────────────────────────

describe("authenticateWithCode", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it("should return user data on successful authentication", async () => {
		expect.assertions(4);

		const mockResponse = {
			user: {
				id: "user_123",
				email: "admin@example.com",
				first_name: "Test",
				last_name: "User",
				email_verified: true,
				created_at: "2024-01-01T00:00:00Z",
				updated_at: "2024-01-01T00:00:00Z",
			},
			organization_id: "org_test",
			access_token: "at_test",
			refresh_token: "rt_test",
		};

		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(JSON.stringify(mockResponse), { status: 200 }),
		);

		const result = await authenticateWithCode({
			code: "auth_code_123",
			clientId: "client_test",
			apiKey: "sk_test",
		});

		expect(result).not.toBeNull();
		expect(result!.user.email).toBe("admin@example.com");
		expect(result!.accessToken).toBe("at_test");
		expect(result!.organizationId).toBe("org_test");
	});

	it("should call the User Management authenticate endpoint", async () => {
		expect.assertions(2);

		const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(JSON.stringify({ user: null }), { status: 401 }),
		);

		await authenticateWithCode({
			code: "code",
			clientId: "client_test",
			apiKey: "sk_test",
		});

		expect(fetchSpy).toHaveBeenCalledOnce();
		const callUrl = fetchSpy.mock.calls[0]?.[0];
		expect(callUrl).toBe(
			"https://api.workos.com/user_management/authenticate",
		);
	});

	it("should return null on non-OK response", async () => {
		expect.assertions(1);

		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response("Unauthorized", { status: 401 }),
		);

		const result = await authenticateWithCode({
			code: "bad_code",
			clientId: "client_test",
			apiKey: "sk_test",
		});

		expect(result).toBeNull();
	});

	it("should return null when user data is incomplete", async () => {
		expect.assertions(1);

		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(
				JSON.stringify({ user: { id: null, email: null } }),
				{ status: 200 },
			),
		);

		const result = await authenticateWithCode({
			code: "code",
			clientId: "client_test",
			apiKey: "sk_test",
		});

		expect(result).toBeNull();
	});
});

// ── Session management (seal/unseal) ─────────────────────────────────────────

describe("session management", () => {
	const COOKIE_PASSWORD =
		"test-password-that-is-at-least-32-chars-long!!";

	const mockSession: AuthSession = {
		userId: "user_123",
		email: "admin@example.com",
		organizationId: "org_test",
		firstName: "Test",
		lastName: "User",
		accessToken: "at_test",
		refreshToken: "rt_test",
	};

	const createMockCookies = () => {
		const store = new Map<string, string>();
		return {
			get: (name: string) => store.get(name),
			set: (
				name: string,
				value: string,
				_opts?: Record<string, unknown>,
			) => {
				store.set(name, value);
			},
			delete: (name: string, _opts?: Record<string, unknown>) => {
				store.delete(name);
			},
			_store: store,
		} as unknown as import("@sveltejs/kit").Cookies;
	};

	it("should round-trip a session through seal/unseal", async () => {
		expect.assertions(5);

		const cookies = createMockCookies();
		await createSession(cookies, mockSession, COOKIE_PASSWORD);

		const restored = await getSession(cookies, COOKIE_PASSWORD);
		expect(restored).not.toBeNull();
		expect(restored!.userId).toBe("user_123");
		expect(restored!.email).toBe("admin@example.com");
		expect(restored!.organizationId).toBe("org_test");
		expect(restored!.accessToken).toBe("at_test");
	});

	it("should return null when no cookie exists", async () => {
		expect.assertions(1);

		const cookies = createMockCookies();
		const session = await getSession(cookies, COOKIE_PASSWORD);
		expect(session).toBeNull();
	});

	it("should return null and delete cookie on tampered data", async () => {
		expect.assertions(2);

		const cookies = createMockCookies();
		await createSession(cookies, mockSession, COOKIE_PASSWORD);

		// Tamper with the cookie
		const store = (
			cookies as unknown as { _store: Map<string, string> }
		)._store;
		store.set("session", "tampered-garbage-data");

		const session = await getSession(cookies, COOKIE_PASSWORD);
		expect(session).toBeNull();
		expect(store.has("session")).toBe(false);
	});

	it("should return null with wrong password", async () => {
		expect.assertions(1);

		const cookies = createMockCookies();
		await createSession(cookies, mockSession, COOKIE_PASSWORD);

		const session = await getSession(
			cookies,
			"wrong-password-that-is-also-32-chars-long!!",
		);
		expect(session).toBeNull();
	});

	it("should clear session cookie", () => {
		expect.assertions(1);

		const cookies = createMockCookies();
		const store = (
			cookies as unknown as { _store: Map<string, string> }
		)._store;
		store.set("session", "some-value");

		clearSession(cookies);
		expect(store.has("session")).toBe(false);
	});
});
