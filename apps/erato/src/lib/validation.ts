/** @format */

import type { Context } from "hono";
import { z, type ZodSchema } from "zod";
import { zodErrors } from "./errors";

export const parseBody = async <T>(
	c: Context,
	schema: ZodSchema<T>,
): Promise<T | Response> => {
	const raw = await c.req.json().catch(() => null);
	if (!raw) {
		return c.json(
			{
				error: "Invalid JSON body",
				errors: [
					{
						code: "PARSE_ERROR",
						message: "Invalid JSON body",
					},
				],
			},
			400,
		);
	}

	const result = schema.safeParse(raw);
	if (!result.success) {
		return zodErrors(c, result.error);
	}

	return result.data;
};

export const isResponse = (value: unknown): value is Response =>
	value instanceof Response;

export { z };
