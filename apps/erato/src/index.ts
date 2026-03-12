/** @format */

import { Hono } from "hono";
import { API_BASE_PATH } from "./config/api-version";
import type { AppEnv } from "./env";
import { authMiddleware } from "./auth/middleware";
import { routeRegistry, type RouteMetadata } from "./registry";
import { corsMiddleware } from "./lib/cors";
import healthExport from "./routes/health";
import * as allRoutes from "./routes/index";

export type { AppEnv } from "./env";

type RouteExport = {
	route: Hono<AppEnv>;
	method: RouteMetadata["method"];
	path: string;
	description?: string;
	auth_required?: boolean;
	scopes?: string[];
};

const isRouteExport = (value: unknown): value is RouteExport =>
	typeof value === "object" &&
	value !== null &&
	"route" in value &&
	"method" in value &&
	"path" in value;

const app = new Hono<AppEnv>();

// CORS on all routes
app.use("*", corsMiddleware());

// Health: unauthenticated, on root app
routeRegistry.push({
	method: healthExport.method,
	path: healthExport.path,
	description: healthExport.description ?? `Route: ${healthExport.path}`,
	auth_required: healthExport.auth_required ?? false,
	scopes: healthExport.scopes,
});
app.route(API_BASE_PATH, healthExport.route);

// Auth-protected API router
const api = new Hono<AppEnv>();
api.use("*", authMiddleware);

const registerRoutes = (obj: Record<string, unknown>) => {
	for (const value of Object.values(obj)) {
		if (!value) continue;

		if (isRouteExport(value)) {
			routeRegistry.push({
				method: value.method,
				path: value.path,
				description:
					value.description ??
					`Route: ${value.path}`,
				auth_required: value.auth_required ?? true,
				scopes: value.scopes,
			});
			api.route("", value.route);
			continue;
		}

		if (typeof value === "object" && value !== null) {
			registerRoutes(value as Record<string, unknown>);
		}
	}
};

registerRoutes(allRoutes);

app.route(API_BASE_PATH, api);

export default app;
