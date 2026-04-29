/** @format */

import type { Cookies, RequestEvent } from "@sveltejs/kit";
import { describe, expect, it, vi } from "vitest";
import {
	authenticateSvelteKitSession,
	clearOAuthState,
	commitOAuthState,
	commitSealedSession,
	createAuthHandle,
	getRequestMetadata,
	isExpectedAuthenticationFailure,
	matchesProtectedPath,
	readOAuthState,
} from "../src/sveltekit.js";
import { TerminalAuthError } from "../src/errors.js";
import type { AuthRuntime } from "../src/runtime.js";
import type { AuthSessionResult } from "../src/types.js";
import { createVestaProvisioningAdapter } from "../src/vesta-provisioning.js";

const createMockCookies = (initial: Record<string, string> = {}) => {
	const values = new Map(Object.entries(initial));
	const sets: Array<{
		name: string;
		value: string;
		options: Record<string, unknown>;
	}> = [];
	const deletions: Array<{
		name: string;
		options: Record<string, unknown>;
	}> = [];

	const cookies = {
		get: (name: string) => values.get(name),
		getAll: () =>
			[...values.entries()].map(([name, value]) => ({
				name,
				value,
			})),
		set: (
			name: string,
			value: string,
			options: Record<string, unknown>,
		) => {
			values.set(name, value);
			sets.push({ name, value, options });
		},
		delete: (name: string, options: Record<string, unknown>) => {
			values.delete(name);
			deletions.push({ name, options });
		},
		serialize: () => "",
	} satisfies Cookies;

	return {
		cookies,
		sets,
		deletions,
	};
};

const createRuntime = (
	authenticateSealedSession: AuthRuntime["authenticateSealedSession"],
): AuthRuntime => ({
	getAuthorizationUrl: () => "https://example.com/login",
	authenticateWithCode: async () => {
		throw new Error("not implemented");
	},
	authenticateSealedSession,
	getLogoutUrl: async () => null,
	getUser: async () => {
		throw new Error("not implemented");
	},
	getOrganization: async () => {
		throw new Error("not implemented");
	},
	listOrganizations: async () => ({
		data: [],
		before: null,
		after: null,
	}),
	createOrganization: async () => {
		throw new Error("not implemented");
	},
	updateOrganization: async () => {
		throw new Error("not implemented");
	},
	deleteOrganization: async () => undefined,
	listOrganizationMemberships: async () => [],
});

const createEvent = (
	cookies: Cookies,
	url = "https://example.com/admin",
): RequestEvent =>
	({
		cookies,
		locals: { session: null },
		url: new URL(url),
	}) as RequestEvent;

const unauthenticatedResult = (): AuthSessionResult => ({
	authenticated: false,
	refreshed: false,
	reason: "no_session_cookie_provided",
	sealedSession: null,
	session: null,
});

describe("getRequestMetadata", () => {
	it("reads cloudflare client IP when explicitly trusted", () => {
		const request = new Request("https://example.com", {
			headers: {
				"CF-Connecting-IP": "203.0.113.10",
				"User-Agent": "Mozilla/5.0",
			},
		});

		expect(
			getRequestMetadata(request, { trustCloudflare: true }),
		).toEqual({
			ipAddress: "203.0.113.10",
			userAgent: "Mozilla/5.0",
		});
	});

	it("does not trust proxy headers by default", () => {
		const request = new Request("https://example.com", {
			headers: {
				"CF-Connecting-IP": "203.0.113.10",
				"X-Forwarded-For": "203.0.113.11, 198.51.100.7",
			},
		});

		expect(getRequestMetadata(request)).toEqual({
			ipAddress: undefined,
			userAgent: undefined,
		});
	});

	it("can opt in to the first forwarded-for address", () => {
		const request = new Request("https://example.com", {
			headers: {
				"X-Forwarded-For": "203.0.113.11, 198.51.100.7",
			},
		});

		expect(
			getRequestMetadata(request, {
				trustForwardedFor: true,
			}),
		).toEqual({
			ipAddress: "203.0.113.11",
			userAgent: undefined,
		});
	});
});

describe("isExpectedAuthenticationFailure", () => {
	it("treats real provisioning failures as expected auth failures", async () => {
		const adapter = createVestaProvisioningAdapter({
			store: {
				ensureOrganization: async () => undefined,
				upsertUser: async () => undefined,
			},
		});

		let thrown: unknown;
		try {
			await adapter.provision({
				session: {
					sessionId: "sess_123",
					userId: "user_123",
					email: "mia@example.com",
					firstName: "Mia",
					lastName: "Example",
					emailVerified: true,
					profilePictureUrl: null,
					organizationId: null,
					roleSlug: null,
					permissions: [],
					entitlements: [],
					memberships: [],
				},
			});
		} catch (error) {
			thrown = error;
		}

		expect(thrown).toBeInstanceOf(TerminalAuthError);
		expect((thrown as TerminalAuthError).status).toBe(401);
		expect(isExpectedAuthenticationFailure(thrown)).toBe(true);
	});
});

describe("protected path matching", () => {
	it("matches exact paths and child segments only", () => {
		expect(matchesProtectedPath("/admin", "/admin")).toBe(true);
		expect(matchesProtectedPath("/admin/settings", "/admin")).toBe(
			true,
		);
		expect(matchesProtectedPath("/admin-assets", "/admin")).toBe(
			false,
		);
		expect(matchesProtectedPath("/dashboard", "/dash")).toBe(false);
	});
});

describe("oauth state cookies", () => {
	it("stores and clears the auth state; secure flag only when requested", () => {
		const { cookies, sets, deletions } = createMockCookies();

		commitOAuthState(cookies, "state_123");

		expect(readOAuthState(cookies)).toBe("state_123");
		expect(sets[0]?.options).toMatchObject({
			httpOnly: true,
			sameSite: "lax",
			path: "/",
		});
		expect(sets[0]?.options).not.toHaveProperty("secure");

		clearOAuthState(cookies);

		expect(readOAuthState(cookies)).toBeUndefined();
		expect(deletions[0]).toEqual({
			name: "workos_oauth_state",
			options: { path: "/" },
		});
	});

	it("sets secure flag when secure: true", () => {
		const { cookies, sets } = createMockCookies();
		commitOAuthState(cookies, "state_123", { secure: true });
		expect(sets[0]?.options).toMatchObject({
			httpOnly: true,
			sameSite: "lax",
			path: "/",
			secure: true,
		});
	});

	it("commits the sealed session; secure flag only when requested", () => {
		const { cookies, sets } = createMockCookies();

		commitSealedSession(cookies, "sealed_123");

		expect(sets[0]?.options).toMatchObject({
			httpOnly: true,
			sameSite: "lax",
			path: "/",
		});
		expect(sets[0]?.options).not.toHaveProperty("secure");
	});

	it("sets secure flag on session cookie when secure: true", () => {
		const { cookies, sets } = createMockCookies();
		commitSealedSession(cookies, "sealed_123", { secure: true });
		expect(sets[0]?.options).toMatchObject({
			httpOnly: true,
			sameSite: "lax",
			path: "/",
			secure: true,
		});
	});
});

describe("createAuthHandle", () => {
	it("treats corrupted sealed sessions as unauthenticated and clears the cookie", async () => {
		const { cookies, deletions } = createMockCookies({
			session: "sealed_existing",
		});

		const result = await authenticateSvelteKitSession({
			cookies,
			runtime: createRuntime(async () => {
				throw new TerminalAuthError(
					"failed to decrypt session",
					"loadSealedSession",
				);
			}),
		});

		expect(result).toEqual({
			authenticated: false,
			refreshed: false,
			reason: "invalid_session",
			sealedSession: null,
			session: null,
		});
		expect(deletions).toEqual([
			{
				name: "session",
				options: { path: "/" },
			},
		]);
	});

	it("rethrows unexpected session errors without clearing the cookie", async () => {
		const { cookies, deletions } = createMockCookies({
			session: "sealed_existing",
		});
		const resolve = vi.fn(async () => new Response("ok"));
		const handle = createAuthHandle({
			runtime: createRuntime(async () => {
				throw new Error("boom");
			}),
			protectedPaths: [],
		});

		await expect(
			handle({
				event: createEvent(cookies),
				resolve,
			}),
		).rejects.toThrow("boom");

		expect(deletions).toHaveLength(0);
		expect(resolve).not.toHaveBeenCalled();
	});

	it("matches protected paths on segment boundaries only", async () => {
		const { cookies } = createMockCookies();
		const resolve = vi.fn(async () => new Response("ok"));
		const handle = createAuthHandle({
			runtime: createRuntime(async () =>
				unauthenticatedResult(),
			),
			protectedPaths: ["/dash"],
		});

		const response = await handle({
			event: createEvent(
				cookies,
				"https://example.com/dashboard",
			),
			resolve,
		});

		expect(resolve).toHaveBeenCalledOnce();
		expect(response).toBeInstanceOf(Response);
		expect(response.status).toBe(200);
	});

	it("rejects malformed protected paths", () => {
		expect(() =>
			createAuthHandle({
				runtime: createRuntime(async () =>
					unauthenticatedResult(),
				),
				protectedPaths: ["admin"],
			}),
		).toThrow("Protected path must start with /");
	});
});
