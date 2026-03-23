/** @format */

import type { Cookies } from "@sveltejs/kit";
import { describe, expect, it, vi } from "vitest";
import {
	commitOAuthState,
	commitSealedSession,
	createAuthHandle,
	clearOAuthState,
	getRequestMetadata,
	readOAuthState,
} from "../src/sveltekit.js";

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
	it("stores and clears the auth state without forcing secure cookies", () => {
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

	it("commits the sealed session without forcing secure cookies", () => {
		const { cookies, sets } = createMockCookies();

		commitSealedSession(cookies, "sealed_123");

		expect(sets[0]?.options).toMatchObject({
			httpOnly: true,
			sameSite: "lax",
			path: "/",
		});
		expect(sets[0]?.options).not.toHaveProperty("secure");
	});
});

describe("createAuthHandle", () => {
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
