/** @format */

import { describe, expect, it } from "vitest";
import {
	RetryableAuthError,
	TerminalAuthError,
	normalizeAuthError,
} from "../src/errors.js";

describe("normalizeAuthError", () => {
	it("treats missing status codes as terminal failures", () => {
		const normalized = normalizeAuthError(
			"authenticateWithCode",
			new Error("network wobble"),
		);

		expect(normalized).toBeInstanceOf(TerminalAuthError);
		expect(normalized).not.toBeInstanceOf(RetryableAuthError);
	});

	it("keeps 5xx failures retryable", () => {
		const normalized = normalizeAuthError("authenticateWithCode", {
			message: "upstream error",
			status: 503,
		});

		expect(normalized).toBeInstanceOf(RetryableAuthError);
	});

	it("ignores non-HTTP numeric status fields", () => {
		const normalized = normalizeAuthError("authenticateWithCode", {
			message: "bad local code",
			code: -1,
			status: Number.NaN,
		});

		expect(normalized.status).toBeUndefined();
		expect(normalized).toBeInstanceOf(TerminalAuthError);
	});
});
