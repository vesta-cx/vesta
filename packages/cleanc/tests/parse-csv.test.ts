/** @format */

import { describe, it, expect } from "vitest";
import { parseCsv } from "../src/parse-csv.js";

describe("parseCsv", () => {
	it("splits on commas and trims", () => {
		expect(parseCsv("a,b,c")).toEqual(["a", "b", "c"]);
		expect(parseCsv(" a , b , c ")).toEqual(["a", "b", "c"]);
	});

	it("treats \\, as literal comma (no split)", () => {
		expect(parseCsv("a\\,b,c")).toEqual(["a,b", "c"]);
		expect(parseCsv("a\\,b\\,c")).toEqual(["a,b,c"]);
	});

	it("treats \\\\ as literal backslash", () => {
		expect(parseCsv("a\\\\,b")).toEqual(["a\\", "b"]);
		expect(parseCsv("a\\\\\\,b")).toEqual(["a\\,b"]);
	});

	it("filters empty segments", () => {
		expect(parseCsv("a,,b")).toEqual(["a", "b"]);
		expect(parseCsv("  , a ,  ")).toEqual(["a"]);
	});
});
