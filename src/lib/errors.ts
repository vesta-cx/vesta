import type { Context } from "hono";
import type { ZodError } from "zod";

export type ApiError = {
	code?: string;
	message: string;
	path?: string;
};

export type ErrorEnvelope = {
	error?: string;
	errors: ApiError[];
};

export const errorResponse = (
	c: Context,
	status: 400 | 401 | 403 | 404 | 409 | 422 | 500,
	errors: ApiError[],
) => {
	const envelope: ErrorEnvelope = {
		error: errors[0]?.message,
		errors,
	};
	return c.json(envelope, status);
};

export const singleError = (
	c: Context,
	status: 400 | 401 | 403 | 404 | 409 | 422 | 500,
	message: string,
	code?: string,
	path?: string,
) => errorResponse(c, status, [{ code, message, path }]);

export const zodErrors = (c: Context, error: ZodError) => {
	const errors: ApiError[] = error.issues.map((issue) => ({
		code: "VALIDATION_ERROR",
		message: issue.message,
		path: issue.path.join("."),
	}));
	return errorResponse(c, 422, errors);
};

export const notFound = (c: Context, entity: string) =>
	singleError(c, 404, `${entity} not found`, "NOT_FOUND");

export const forbidden = (c: Context, message = "Forbidden: insufficient scope") =>
	singleError(c, 403, message, "FORBIDDEN");

export const conflict = (c: Context, message: string, path?: string) =>
	singleError(c, 409, message, "CONFLICT", path);
