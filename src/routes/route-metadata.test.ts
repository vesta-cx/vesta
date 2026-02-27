/** @format */

import { describe, it, expect } from "vitest";
import * as collections from "./collections/index";
import * as organizations from "./organizations/index";
import * as permissions from "./permissions/index";
import * as engagements from "./engagements/index";
import * as allRoutes from "./index";
import introspect from "./introspect";
import me from "./me";

const expectRouteShape = (mod: unknown) => {
	const r = mod as Record<string, unknown>;
	expect(r).toHaveProperty("route");
	expect(r).toHaveProperty("method");
	expect(r).toHaveProperty("path");
	expect(typeof r.path).toBe("string");
	expect(typeof r.method).toBe("string");
	expect(r).toHaveProperty("auth_required");
};

describe("organizations route metadata", () => {
	it("list exports correct shape", () => {
		expectRouteShape(organizations.list);
		expect(organizations.list.method).toBe("GET");
		expect(organizations.list.path).toBe("/organizations");
		expect(organizations.list.scopes).toContain(
			"organizations:read",
		);
	});

	it("get exports correct shape", () => {
		expectRouteShape(organizations.get);
		expect(organizations.get.method).toBe("GET");
		expect(organizations.get.path).toBe("/organizations/:id");
	});

	it("create exports correct shape", () => {
		expectRouteShape(organizations.create);
		expect(organizations.create.method).toBe("POST");
		expect(organizations.create.path).toBe("/organizations");
		expect(organizations.create.scopes).toContain(
			"organizations:write",
		);
	});

	it("update exports correct shape", () => {
		expectRouteShape(organizations.update);
		expect(organizations.update.method).toBe("PUT");
		expect(organizations.update.path).toBe("/organizations/:id");
	});

	it("remove exports correct shape", () => {
		expectRouteShape(organizations.remove);
		expect(organizations.remove.method).toBe("DELETE");
		expect(organizations.remove.path).toBe("/organizations/:id");
	});
});

describe("permissions get route metadata", () => {
	it("exports correct shape", () => {
		expectRouteShape(permissions.get);
		expect(permissions.get.method).toBe("GET");
		expect(permissions.get.path).toBe("/permissions/:id");
		expect(permissions.get.scopes).toContain("permissions:read");
	});
});

describe("collections route metadata", () => {
	it("exports list/get shape with read scopes", () => {
		expectRouteShape(collections.list);
		expect(collections.list.method).toBe("GET");
		expect(collections.list.path).toBe("/collections");
		expect(collections.list.scopes).toContain("collections:read");

		expectRouteShape(collections.get);
		expect(collections.get.method).toBe("GET");
		expect(collections.get.path).toBe("/collections/:id");
		expect(collections.get.scopes).toContain("collections:read");
	});
});

describe("engagements update route metadata", () => {
	it("exports correct shape", () => {
		expectRouteShape(engagements.update);
		expect(engagements.update.method).toBe("PUT");
		expect(engagements.update.path).toBe("/engagements/:id");
		expect(engagements.update.scopes).toContain(
			"engagements:write",
		);
	});
});

describe("me route metadata", () => {
	it("exports correct shape", () => {
		expectRouteShape(me);
		expect(me.method).toBe("GET");
		expect(me.path).toBe("/me");
		expect(me.auth_required).toBe(true);
	});
});

describe("introspect route metadata", () => {
	it("exports correct shape", () => {
		expectRouteShape(introspect);
		expect(introspect.method).toBe("GET");
		expect(introspect.path).toBe("/introspect/routes");
		expect(introspect.scopes).toContain("admin");
	});
});

const isRouteExport = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" &&
	value !== null &&
	"route" in value &&
	"method" in value &&
	"path" in value &&
	"auth_required" in value;

const collectRouteExports = (
	obj: Record<string, unknown>,
): Record<string, unknown>[] => {
	const out: Record<string, unknown>[] = [];
	for (const value of Object.values(obj)) {
		if (!value) continue;
		if (isRouteExport(value)) {
			out.push(value);
			continue;
		}
		if (typeof value === "object") {
			out.push(
				...collectRouteExports(
					value as Record<string, unknown>,
				),
			);
		}
	}
	return out;
};

describe("auth metadata consistency", () => {
	it("marks all exported API routes as auth_required", () => {
		const routes = collectRouteExports(
			allRoutes as Record<string, unknown>,
		);
		expect(routes.length).toBeGreaterThan(0);
		for (const route of routes) {
			expect(route.auth_required).toBe(true);
		}
	});

	it("does not export removed collection visibility routes", () => {
		const routes = collectRouteExports(
			allRoutes as Record<string, unknown>,
		);
		const paths = routes.map((route) => route.path);
		expect(paths).not.toContain("/collections/:collectionId/visibility");
	});
});
