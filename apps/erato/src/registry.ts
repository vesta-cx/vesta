/** @format */

import type { Scope } from "./auth/types";

export type RouteMetadata = {
	method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
	path: string;
	description: string;
	auth_required: boolean;
	scopes?: readonly Scope[];
};

export type RouteMetadataInput = Omit<
	RouteMetadata,
	"description" | "auth_required"
> &
	Partial<Pick<RouteMetadata, "description" | "auth_required">>;

const registry: RouteMetadata[] = [];

export const routeRegistry: readonly RouteMetadata[] = registry;

/** Records route metadata once, applying default description/auth values and rejecting duplicates. */
export const recordRouteMetadata = (
	input: RouteMetadataInput,
): RouteMetadata => {
	const metadata: RouteMetadata = {
		method: input.method,
		path: input.path,
		description: input.description ?? `Route: ${input.path}`,
		auth_required: input.auth_required ?? true,
		...(input.scopes ? { scopes: input.scopes } : {}),
	};

	const existing = registry.find(
		(route) =>
			route.method === metadata.method &&
			route.path === metadata.path,
	);
	if (existing) {
		throw new Error(
			`Duplicate route metadata: ${metadata.method} ${metadata.path}`,
		);
	}

	registry.push(metadata);
	return metadata;
};
