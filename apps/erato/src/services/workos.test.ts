/** @format */

import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	createWorkOSTransport,
	getOrganization,
	getUser,
	listOrganizations,
} = vi.hoisted(() => ({
	createWorkOSTransport: vi.fn(),
	getOrganization: vi.fn(),
	getUser: vi.fn(),
	listOrganizations: vi.fn(),
}));

vi.mock("@vesta-cx/auth", () => ({
	createWorkOSTransport,
}));

describe("workos service", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();

		getOrganization.mockResolvedValue({
			id: "org_123",
			name: "Test Org",
			createdAt: "2026-03-23T00:00:00.000Z",
			updatedAt: "2026-03-23T00:00:00.000Z",
		});
		getUser.mockResolvedValue({
			id: "user_123",
			email: "mia@example.com",
			firstName: "Mia",
			lastName: "Example",
			organizationId: "org_123",
			createdAt: "2026-03-23T00:00:00.000Z",
			updatedAt: "2026-03-23T00:00:00.000Z",
		});
		listOrganizations.mockResolvedValue({
			data: [],
			before: null,
			after: null,
		});

		createWorkOSTransport.mockImplementation(() => ({
			getOrganization,
			getUser,
			listOrganizations,
			createOrganization: vi.fn(),
			updateOrganization: vi.fn(),
			deleteOrganization: vi.fn(),
		}));
	});

	it("creates a fresh transport for each call", async () => {
		const { workos } = await import("./workos");

		await workos.organizations.get("sk_test", "org_123");
		await workos.organizations.list("sk_test");
		await workos.users.get("sk_test", "user_123");

		expect(createWorkOSTransport).toHaveBeenCalledTimes(3);
		expect(createWorkOSTransport).toHaveBeenNthCalledWith(1, {
			apiKey: "sk_test",
		});
		expect(createWorkOSTransport).toHaveBeenNthCalledWith(2, {
			apiKey: "sk_test",
		});
		expect(createWorkOSTransport).toHaveBeenNthCalledWith(3, {
			apiKey: "sk_test",
		});
	});
});
