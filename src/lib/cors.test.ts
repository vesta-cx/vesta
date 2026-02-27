/** @format */

import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import { corsMiddleware } from "./cors";

const createApp = (envOrigins?: string) => {
	const app = new Hono();
	app.use("*", corsMiddleware(envOrigins));
	app.get("/test", (c) => c.json({ ok: true }));
	return app;
};

describe("CORS middleware", () => {
	it("allows https://vesta.cx", async () => {
		const app = createApp();
		const res = await app.request("/test", {
			headers: { Origin: "https://vesta.cx" },
		});
		expect(res.headers.get("access-control-allow-origin")).toBe(
			"https://vesta.cx",
		);
	});

	it("allows subdomains of vesta.cx", async () => {
		const app = createApp();
		const res = await app.request("/test", {
			headers: { Origin: "https://app.vesta.cx" },
		});
		expect(res.headers.get("access-control-allow-origin")).toBe(
			"https://app.vesta.cx",
		);
	});

	it("rejects deep subdomains (>3 levels)", async () => {
		const app = createApp();
		const res = await app.request("/test", {
			headers: { Origin: "https://deep.sub.vesta.cx" },
		});
		expect(res.headers.get("access-control-allow-origin")).not.toBe(
			"https://deep.sub.vesta.cx",
		);
	});

	it("rejects unknown origins", async () => {
		const app = createApp();
		const res = await app.request("/test", {
			headers: { Origin: "https://evil.com" },
		});
		expect(res.headers.get("access-control-allow-origin")).not.toBe(
			"https://evil.com",
		);
	});

	it("allows additional env origins", async () => {
		const app = createApp("https://localhost:3000");
		const res = await app.request("/test", {
			headers: { Origin: "https://localhost:3000" },
		});
		expect(res.headers.get("access-control-allow-origin")).toBe(
			"https://localhost:3000",
		);
	});

	it("handles OPTIONS preflight", async () => {
		const app = createApp();
		const res = await app.request("/test", {
			method: "OPTIONS",
			headers: {
				"Origin": "https://vesta.cx",
				"Access-Control-Request-Method": "POST",
			},
		});
		expect(res.status).toBe(204);
	});
});
