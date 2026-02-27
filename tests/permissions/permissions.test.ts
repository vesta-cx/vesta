/** @format */

import { describe, expect, it } from "vitest";
import {
	canPrincipalPerformAction,
	resolvePermissionValue,
	type PermissionRow,
} from "../../src/permissions/index.js";

const baseRows: PermissionRow[] = [
	{
		subjectType: "user",
		subjectId: "u_1",
		objectType: "collection",
		objectId: "col_1",
		action: "collections:read",
		value: "allow",
	},
	{
		subjectType: "team",
		subjectId: "t_1",
		objectType: "collection",
		objectId: "col_1",
		action: "collections:read",
		value: "deny",
	},
	{
		subjectType: "organization",
		subjectId: "org_1",
		objectType: "collection",
		objectId: "col_1",
		action: "collections:read",
		value: "allow",
	},
	{
		subjectType: "static",
		subjectId: "follower",
		objectType: "collection",
		objectId: "col_1",
		action: "collections:read",
		value: "allow",
	},
];

describe("resolvePermissionValue", () => {
	it("resolves by precedence order and deny-first within each level", () => {
		const value = resolvePermissionValue(baseRows, {
			objectType: "collection",
			objectId: "col_1",
			action: "collections:read",
			principals: [
				{ subjectType: "user", subjectId: "u_1" },
				{ subjectType: "team", subjectId: "t_1" },
			],
		});

		// user allow beats team deny because user level is higher precedence.
		expect(value).toBe("allow");
	});

	it("returns unset when no rows match action/object/principal", () => {
		const value = resolvePermissionValue(baseRows, {
			objectType: "collection",
			objectId: "col_1",
			action: "collections:write",
			principals: [{ subjectType: "user", subjectId: "u_1" }],
		});

		expect(value).toBe("unset");
	});

	it("supports static subject matching for follower-only use-cases", () => {
		const value = resolvePermissionValue(baseRows, {
			objectType: "collection",
			objectId: "col_1",
			action: "collections:read",
			principals: [{ subjectType: "static", subjectId: "follower" }],
		});

		expect(value).toBe("allow");
	});
});

describe("canPrincipalPerformAction", () => {
	it("returns true only when merged value is allow", () => {
		expect(
			canPrincipalPerformAction(baseRows, {
				objectType: "collection",
				objectId: "col_1",
				action: "collections:read",
				principals: [{ subjectType: "user", subjectId: "u_1" }],
			}),
		).toBe(true);

		expect(
			canPrincipalPerformAction(baseRows, {
				objectType: "collection",
				objectId: "col_1",
				action: "collections:write",
				principals: [{ subjectType: "user", subjectId: "u_1" }],
			}),
		).toBe(false);
	});

	it("supports owner override regardless of merged permission result", () => {
		expect(
			canPrincipalPerformAction(baseRows, {
				objectType: "collection",
				objectId: "col_1",
				action: "collections:write",
				principals: [{ subjectType: "user", subjectId: "u_1" }],
				isOwner: true,
			}),
		).toBe(true);
	});
});
