/** @format */

import { describe, expect, it } from "vitest";
import { getRequestMetadata } from "../src/sveltekit.js";

describe("getRequestMetadata", () => {
	it("reads cloudflare client IP and user agent", () => {
		const request = new Request("https://example.com", {
			headers: {
				"CF-Connecting-IP": "203.0.113.10",
				"User-Agent": "Mozilla/5.0",
			},
		});

		expect(getRequestMetadata(request)).toEqual({
			ipAddress: "203.0.113.10",
			userAgent: "Mozilla/5.0",
		});
	});

	it("falls back to the first forwarded-for address", () => {
		const request = new Request("https://example.com", {
			headers: {
				"X-Forwarded-For": "203.0.113.11, 198.51.100.7",
			},
		});

		expect(getRequestMetadata(request)).toEqual({
			ipAddress: "203.0.113.11",
			userAgent: undefined,
		});
	});
});
