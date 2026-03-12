/** @format */

import { describe, expect, it } from "vitest";
import {
	createCollectionSchema,
	isAutoCollection,
	updateCollectionSchema,
} from "./collections";

describe("collection schemas", () => {
	it("accepts manual collections without kind", () => {
		const result = createCollectionSchema.safeParse({
			ownerType: "user",
			ownerId: "user_1",
			name: "My Favorites",
			type: "manual",
		});
		expect(result.success).toBe(true);
	});

	it("accepts auto collections with kind", () => {
		const result = createCollectionSchema.safeParse({
			ownerType: "user",
			ownerId: "user_1",
			name: "Following Feed",
			type: "auto",
			kind: "following",
		});
		expect(result.success).toBe(true);
	});

	it("rejects auto collections without kind", () => {
		const result = createCollectionSchema.safeParse({
			ownerType: "user",
			ownerId: "user_1",
			name: "Broken Auto",
			type: "auto",
		});
		expect(result.success).toBe(false);
	});

	it("rejects manual collections with kind", () => {
		const result = createCollectionSchema.safeParse({
			ownerType: "user",
			ownerId: "user_1",
			name: "Manual With Kind",
			type: "manual",
			kind: "likes",
		});
		expect(result.success).toBe(false);
	});

	it("rejects legacy collection types", () => {
		const result = updateCollectionSchema.safeParse({
			type: "custom",
		});
		expect(result.success).toBe(false);
	});
});

describe("isAutoCollection", () => {
	it("returns true for auto collections", () => {
		expect(isAutoCollection({ type: "auto" })).toBe(true);
	});

	it("returns false for manual collections", () => {
		expect(isAutoCollection({ type: "manual" })).toBe(false);
	});
});
