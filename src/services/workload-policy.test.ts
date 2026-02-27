/** @format */

import { describe, expect, it } from "vitest";
import {
	DEFAULT_WORKLOAD,
	normalizeWorkloadToken,
	parseAllowedWorkloads,
} from "./workload-policy.js";

describe("workload policy", () => {
	it("defaults to audio:transcode when unset", () => {
		expect(parseAllowedWorkloads(undefined)).toEqual([DEFAULT_WORKLOAD]);
	});

	it("parses comma-separated workload tokens", () => {
		expect(parseAllowedWorkloads("audio:transcode,audio:analyze")).toEqual([
			"audio:transcode",
			"audio:analyze",
		]);
	});

	it("ignores invalid values and keeps valid workloads", () => {
		expect(parseAllowedWorkloads("gpu-heavy,audio:transcode")).toEqual([
			"audio:transcode",
		]);
	});

	it("normalizes tokens and rejects malformed values", () => {
		expect(normalizeWorkloadToken("AUDIO:ANALYZE")).toBe("audio:analyze");
		expect(normalizeWorkloadToken("audio")).toBeNull();
		expect(normalizeWorkloadToken("audio:analyze:extra")).toBeNull();
	});
});
