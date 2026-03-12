/** @format */

import { describe, it, expect } from "vitest";
import { createEngagementSchema } from "./engagements";

describe("createEngagementSchema", () => {
	it("validates a valid create payload", () => {
		const result = createEngagementSchema.safeParse({
			subjectType: "user",
			subjectId: "user_01",
			action: "like",
			objectType: "resource",
			objectId: "res_01",
		});
		expect(result.success).toBe(true);
	});

	it("requires all mandatory fields", () => {
		const result = createEngagementSchema.safeParse({
			subjectType: "user",
		});
		expect(result.success).toBe(false);
	});

	it("accepts optional comment", () => {
		const result = createEngagementSchema.safeParse({
			subjectType: "user",
			subjectId: "user_01",
			action: "comment",
			objectType: "resource",
			objectId: "res_01",
			comment: { text: "Nice track!" },
		});
		expect(result.success).toBe(true);
	});

	it("accepts optional mention", () => {
		const result = createEngagementSchema.safeParse({
			subjectType: "user",
			subjectId: "user_01",
			action: "mention",
			objectType: "resource",
			objectId: "res_01",
			mention: {
				mentionedType: "user",
				mentionedId: "user_02",
			},
		});
		expect(result.success).toBe(true);
	});
});
