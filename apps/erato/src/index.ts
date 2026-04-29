/** @format */

import { Hono } from "hono";
import { API_BASE_PATH } from "./config/api-version";
import type { AppEnv } from "./env";
import { browserAuthRoutes } from "./auth/browser";
import { authMiddleware } from "./auth/middleware";
import {
	recordRouteMetadata,
	type RouteMetadata,
	type RouteMetadataInput,
} from "./registry";
import { corsMiddleware } from "./lib/cors";
import healthExport from "./routes/health";
import * as allRoutes from "./routes/index";

export type { AppEnv } from "./env";

type RouteExport = RouteMetadataInput & {
	route: Hono<AppEnv>;
};

const isRouteNamespace = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" &&
	value !== null &&
	!Array.isArray(value) &&
	!(value instanceof Hono);

const isRouteExport = (value: unknown): value is RouteExport =>
	isRouteNamespace(value) &&
	"route" in value &&
	"method" in value &&
	"path" in value &&
	value.route instanceof Hono &&
	["GET", "POST", "PUT", "PATCH", "DELETE"].includes(
		String(value.method),
	) &&
	typeof value.path === "string";

const app = new Hono<AppEnv>();

// CORS on all routes
app.use("*", (c, next) => corsMiddleware(c.env.CORS_ORIGINS)(c, next));

// Health: unauthenticated, on root app
recordRouteMetadata({ ...healthExport, auth_required: false });
app.route(API_BASE_PATH, healthExport.route);
app.route(API_BASE_PATH, browserAuthRoutes);

// Auth-protected API router
const api = new Hono<AppEnv>();
api.use("*", authMiddleware);

const registerRoutes = (obj: Record<string, unknown>) => {
	for (const value of Object.values(obj)) {
		if (!value) continue;

		if (isRouteExport(value)) {
			recordRouteMetadata(value);
			api.route("/", value.route);
			continue;
		}

		if (isRouteNamespace(value)) {
			registerRoutes(value);
		}
	}
};

registerRoutes(allRoutes);

app.route(API_BASE_PATH, api);

export default app;
