/** @format */

import { describe, expect, it } from "vitest";
import { parseByteSize } from "./byte-size.js";

describe("parseByteSize", () => {
	it("accepts plain byte numbers", () => {
		expect(parseByteSize("1024", 1)).toBe(1024);
	});

	it("accepts decimal unit suffixes", () => {
		expect(parseByteSize("10M", 1)).toBe(10_000_000);
		expect(parseByteSize("50g", 1)).toBe(50_000_000_000);
	});

	it("accepts binary unit suffixes", () => {
		expect(parseByteSize("512KiB", 1)).toBe(524_288);
		expect(parseByteSize("1GiB", 1)).toBe(1_073_741_824);
	});

	it("falls back on invalid input", () => {
		expect(parseByteSize("not-a-size", 123)).toBe(123);
		expect(parseByteSize(undefined, 123)).toBe(123);
	});
});
