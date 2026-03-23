/** @format */

import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	authenticateSealedSession,
	commitOAuthState,
	createOAuthState,
	createWebAuthRuntime,
	getAuthorizationUrl,
	readSessionCookie,
} = vi.hoisted(() => ({
	authenticateSealedSession: vi.fn(),
	commitOAuthState: vi.fn(),
	createOAuthState: vi.fn(),
	createWebAuthRuntime: vi.fn(),
	getAuthorizationUrl: vi.fn(),
	readSessionCookie: vi.fn(),
}));

vi.mock("$lib/server/auth", () => ({
	createWebAuthRuntime,
}));

vi.mock("@vesta-cx/auth", () => ({
	commitOAuthState,
	createOAuthState,
	readSessionCookie,
}));

describe("login page load", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();

		createWebAuthRuntime.mockReturnValue({
			authenticateSealedSession,
			getAuthorizationUrl,
		});
		authenticateSealedSession.mockRejectedValue(new Error("corrupted session"));
		getAuthorizationUrl.mockReturnValue("https://example.com/auth/start");
		createOAuthState.mockReturnValue("state_123");
		readSessionCookie.mockReturnValue("sealed_corrupted");
	});

	it("redirects to WorkOS when the session cookie is corrupted", async () => {
		const { load } = await import("./+page.server");
		const cookies = {
			get: vi.fn(),
			set: vi.fn(),
			delete: vi.fn(),
		};

		await expect(
			load({
				cookies,
				platform: {},
				url: new URL("https://example.com/auth/login"),
			} as never),
		).rejects.toMatchObject({
			status: 302,
			location: "https://example.com/auth/start",
		});

		expect(authenticateSealedSession).toHaveBeenCalledWith({
			sealedSession: "sealed_corrupted",
		});
		expect(commitOAuthState).toHaveBeenCalledWith(
			cookies,
			"state_123",
			undefined,
			undefined,
			true,
		);
	});
});
