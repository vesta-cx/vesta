/** @format */

import { describe, it, expect } from "vitest";
import {
	hashApiKey,
	isAuthenticated,
	requireAuth,
	hasScope,
	requireScope,
	scopeForMethod,
} from "./helpers";
import type { AuthContext } from "./types";

const guest: AuthContext = { type: "guest" };
const readUser: AuthContext = {
	type: "apikey",
	subjectType: "user",
	subjectId: "user_01",
	scopes: ["resources:read"],
};
const admin: AuthContext = {
	type: "apikey",
	subjectType: "user",
	subjectId: "user_admin",
	scopes: ["admin"],
};
const multiScope: AuthContext = {
	type: "apikey",
	subjectType: "user",
	subjectId: "user_02",
	scopes: ["resources:read", "resources:write"],
};

describe("hashApiKey", () => {
	it("returns a 64-char hex string", async () => {
		const hash = await hashApiKey("test-key");
		expect(hash).toMatch(/^[0-9a-f]{64}$/);
	});

	it("is deterministic", async () => {
		const a = await hashApiKey("same-key");
		const b = await hashApiKey("same-key");
		expect(a).toBe(b);
	});

	it("produces different hashes for different inputs", async () => {
		const a = await hashApiKey("key-a");
		const b = await hashApiKey("key-b");
		expect(a).not.toBe(b);
	});
});

describe("isAuthenticated", () => {
	it("returns false for guest", () => {
		expect(isAuthenticated(guest)).toBe(false);
	});

	it("returns true for apikey", () => {
		expect(isAuthenticated(readUser)).toBe(true);
	});
});

describe("requireAuth", () => {
	it("throws 401 for guest", () => {
		expect(() => requireAuth(guest)).toThrow();
		try {
			requireAuth(guest);
		} catch (e: unknown) {
			expect((e as { status: number }).status).toBe(401);
		}
	});

	it("returns ApiKeyAuth for authenticated user", () => {
		const result = requireAuth(readUser);
		expect(result.type).toBe("apikey");
		expect(result.subjectId).toBe("user_01");
	});
});

describe("hasScope", () => {
	it("returns false for guest", () => {
		expect(hasScope(guest, "resources:read")).toBe(false);
	});

	it("returns true when user has the scope", () => {
		expect(hasScope(readUser, "resources:read")).toBe(true);
	});

	it("returns false when user lacks the scope", () => {
		expect(hasScope(readUser, "resources:write")).toBe(false);
	});

	it("admin bypasses all scope checks", () => {
		expect(hasScope(admin, "resources:read")).toBe(true);
		expect(hasScope(admin, "resources:write")).toBe(true);
		expect(hasScope(admin, "workspaces:write")).toBe(true);
		expect(hasScope(admin, "anything:else")).toBe(true);
	});

	it("works with multiple scopes", () => {
		expect(hasScope(multiScope, "resources:read")).toBe(true);
		expect(hasScope(multiScope, "resources:write")).toBe(true);
		expect(hasScope(multiScope, "workspaces:read")).toBe(false);
	});
});

describe("requireScope", () => {
	it("throws 403 for guest", () => {
		try {
			requireScope(guest, "resources:read");
			expect.unreachable("should have thrown");
		} catch (e: unknown) {
			expect((e as { status: number }).status).toBe(403);
		}
	});

	it("throws 403 when scope is missing", () => {
		try {
			requireScope(readUser, "resources:write");
			expect.unreachable("should have thrown");
		} catch (e: unknown) {
			expect((e as { status: number }).status).toBe(403);
		}
	});

	it("does not throw when scope is present", () => {
		expect(() =>
			requireScope(readUser, "resources:read"),
		).not.toThrow();
	});

	it("admin bypasses scope check", () => {
		expect(() =>
			requireScope(admin, "anything:else"),
		).not.toThrow();
	});
});

describe("scopeForMethod", () => {
	it("maps GET to read", () => {
		expect(scopeForMethod("GET")).toBe("read");
		expect(scopeForMethod("get")).toBe("read");
	});

	it("maps mutating methods to write", () => {
		for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
			expect(scopeForMethod(method)).toBe("write");
		}
	});
});
