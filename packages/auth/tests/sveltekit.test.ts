/** @format */

import type { Cookies } from "@sveltejs/kit";
import { describe, expect, it, vi } from "vitest";
import {
	authenticateSvelteKitSession,
	commitOAuthState,
	commitSealedSession,
	createAuthHandle,
	clearOAuthState,
	getRequestMetadata,
	readOAuthState,
} from "../src/sveltekit.js";
import { TerminalAuthError } from "../src/errors.js";

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
	} satisfies Partial<Cookies>;

	return {
		cookies: cookies as Cookies,
		sets,
		deletions,
	};
};

describe("getRequestMetadata", () => {
	it("reads cloudflare client IP and user agent", () => {
		const request = new Request("https://example.com", {
			headers: {
				"CF-Connecting-IP": "203.0.113.10",
				"User-Agent": "Mozilla/5.0",
			},
		});

		expect(getRequestMetadata(request)).toEqual({
			ipAddress: "203.0.113.10",
			userAgent: "Mozilla/5.0",
		});
	});

	it("falls back to the first forwarded-for address", () => {
		const request = new Request("https://example.com", {
			headers: {
				"X-Forwarded-For": "203.0.113.11, 198.51.100.7",
			},
		});

		expect(getRequestMetadata(request)).toEqual({
			ipAddress: "203.0.113.11",
			userAgent: undefined,
		});
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
		commitOAuthState(
			cookies,
			"state_123",
			undefined,
			undefined,
			true,
		);
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
		commitSealedSession(
			cookies,
			"sealed_123",
			undefined,
			undefined,
			true,
		);
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
			runtime: {
				authenticateSealedSession: async () => {
					throw new TerminalAuthError(
						"failed to decrypt session",
						"loadSealedSession",
					);
				},
			} as never,
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
			runtime: {
				authenticateSealedSession: async () => {
					throw new Error("boom");
				},
			} as never,
			protectedPaths: [],
		});

		await expect(
			handle({
				event: {
					cookies,
					locals: {},
					url: new URL(
						"https://example.com/admin",
					),
				} as never,
				resolve,
			}),
		).rejects.toThrow("boom");

		expect(deletions).toHaveLength(0);
		expect(resolve).not.toHaveBeenCalled();
	});
});
