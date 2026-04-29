/** @format */

import { cors } from "hono/cors";

const DEFAULT_ALLOWED_ORIGINS = ["https://vesta.cx"];
const ONE_DAY_SECONDS = 60 * 60 * 24;

const isAllowedOrigin = (origin: string, allowedOrigins: string[]): boolean => {
	if (allowedOrigins.includes(origin)) return true;

	try {
		const url = new URL(origin);
		if (
			url.hostname.endsWith(".vesta.cx") &&
			url.hostname.split(".").length <= 3
		) {
			return true;
		}
	} catch {
		// invalid origin
	}

	return false;
};

export const corsMiddleware = (envOrigins?: string) => {
	const extraOrigins =
		envOrigins ?
			envOrigins
				.split(",")
				.map((s) => s.trim())
				.filter(Boolean)
		:	[];
	const allowedOrigins = [...DEFAULT_ALLOWED_ORIGINS, ...extraOrigins];

	return cors({
		origin: (origin) =>
			isAllowedOrigin(origin, allowedOrigins) ? origin : (
				undefined
			),
		allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		maxAge: ONE_DAY_SECONDS,
	});
};
