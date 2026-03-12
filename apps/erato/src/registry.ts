/** @format */

import type { Hono } from "hono";
import type { AppEnv } from "./env";

export type RouteMetadata = {
	method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
	path: string;
	description: string;
	auth_required: boolean;
	scopes?: string[];
};

export const routeRegistry: RouteMetadata[] = [];

export const registerRoute = (
	app: Hono<AppEnv>,
	router: Hono<AppEnv>,
	metadata: RouteMetadata,
) => {
	routeRegistry.push(metadata);
	app.route("", router);
};
