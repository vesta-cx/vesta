/** @format */

import { describe, expect, it } from "vitest";
import {
	computeBackoffMs,
	isRetryableHttpStatus,
	isStorageAuthStatus,
} from "./retry.js";

describe("retry helpers", () => {
	it("classifies retryable status codes", () => {
		expect(isRetryableHttpStatus(500)).toBe(true);
		expect(isRetryableHttpStatus(423)).toBe(true);
		expect(isRetryableHttpStatus(400)).toBe(false);
	});

	it("identifies storage auth status codes", () => {
		expect(isStorageAuthStatus(401)).toBe(true);
		expect(isStorageAuthStatus(403)).toBe(true);
		expect(isStorageAuthStatus(404)).toBe(false);
	});

	it("uses larger base backoff for 429", () => {
		const slow = computeBackoffMs(1, 429);
		const normal = computeBackoffMs(1, 500);
		expect(slow > normal).toBe(true);
	});
});
