/** @format */

import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import { parseBody, isResponse, z } from "./validation";

const testSchema = z.object({
	name: z.string().min(1),
	email: z.string().email(),
});

const createApp = () => {
	const app = new Hono();
	app.post("/test", async (c) => {
		const result = await parseBody(c, testSchema);
		if (isResponse(result)) return result;
		return c.json({ data: result });
	});
	return app;
};

describe("parseBody", () => {
	it("parses valid JSON body", async () => {
		const app = createApp();
		const res = await app.request("/test", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				name: "Test",
				email: "test@example.com",
			}),
		});
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.data.name).toBe("Test");
	});

	it("returns 400 for invalid JSON", async () => {
		const app = createApp();
		const res = await app.request("/test", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: "not json",
		});
		expect(res.status).toBe(400);
	});

	it("returns 422 with validation errors", async () => {
		const app = createApp();
		const res = await app.request("/test", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				name: "",
				email: "not-an-email",
			}),
		});
		expect(res.status).toBe(422);
		const json = await res.json();
		expect(json.errors.length).toBeGreaterThan(0);
		expect(json.errors[0].code).toBe("VALIDATION_ERROR");
	});
});

describe("isResponse", () => {
	it("returns true for Response instances", () => {
		expect(isResponse(new Response())).toBe(true);
	});

	it("returns false for non-Response values", () => {
		expect(isResponse({ name: "test" })).toBe(false);
		expect(isResponse(null)).toBe(false);
	});
});
