/** @format */

import { describe, expect, it, vi } from "vitest";
import { Hono } from "hono";

import {
	errorResponse,
	singleError,
	notFound,
	forbidden,
	conflict,
} from "./errors";

const createContext = async (handler: (c: any) => any) => {
	const app = new Hono();
	app.get("/test", handler);
	const res = await app.request("/test");
	return { res, json: await res.json() };
};

describe("error helpers", () => {
	it("errorResponse returns multiple errors with status", async () => {
		const { res, json } = await createContext((c) =>
			errorResponse(c, 422, [
				{
					code: "VALIDATION_ERROR",
					message: "Field required",
					path: "name",
				},
				{
					code: "VALIDATION_ERROR",
					message: "Invalid email",
					path: "email",
				},
			]),
		);
		expect(res.status).toBe(422);
		expect(json.errors).toHaveLength(2);
		expect(json.error).toBe("Field required");
	});

	it("singleError returns one error", async () => {
		const { res, json } = await createContext((c) =>
			singleError(c, 400, "Bad request", "BAD_REQUEST"),
		);
		expect(res.status).toBe(400);
		expect(json.errors).toHaveLength(1);
		expect(json.errors[0].code).toBe("BAD_REQUEST");
	});

	it("notFound returns 404", async () => {
		const { res, json } = await createContext((c) =>
			notFound(c, "User"),
		);
		expect(res.status).toBe(404);
		expect(json.errors[0].message).toBe("User not found");
	});

	it("forbidden returns 403", async () => {
		const { res, json } = await createContext((c) => forbidden(c));
		expect(res.status).toBe(403);
		expect(json.errors[0].code).toBe("FORBIDDEN");
	});

	it("conflict returns 409 with path", async () => {
		const { res, json } = await createContext((c) =>
			conflict(c, "Slug taken", "slug"),
		);
		expect(res.status).toBe(409);
		expect(json.errors[0].path).toBe("slug");
	});
});
