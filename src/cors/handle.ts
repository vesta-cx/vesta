/** @format */

import type { Handle } from "@sveltejs/kit";
import { isOriginAllowed, parseAllowedOrigins } from "./index.js";

type Env = { CORS_ORIGINS?: string };

/**
 * Create a SvelteKit Handle that sets CORS headers using strict origin allowlisting.
 * Reads allowed origins from `env.CORS_ORIGINS` (comma-separated).
 * Uses exact string match only — never substring/suffix.
 */
export const createCorsHandle = (options?: {
	/** Path pattern to apply CORS (default: all). Use to limit to /api/* only. */
	pathPattern?: RegExp | ((pathname: string) => boolean);
}): Handle => {
	const pathFilter: (p: string) => boolean =
		options?.pathPattern instanceof RegExp ?
			(p) => (options.pathPattern as RegExp).test(p)
		:	(options?.pathPattern ?? (() => true));

	return async ({ event, resolve }) => {
		const pathname = event.url.pathname;
		if (!pathFilter(pathname)) {
			return resolve(event);
		}

		const env = (event.platform as { env?: Env } | undefined)?.env;
		const allowlist = parseAllowedOrigins(env?.CORS_ORIGINS);
		const origin = event.request.headers.get("Origin");

		const addCorsHeaders = (res: Response): Response => {
			if (
				allowlist.length === 0 ||
				!origin ||
				!isOriginAllowed(origin, allowlist)
			) {
				return res;
			}
			const next = new Response(res.body, {
				status: res.status,
				statusText: res.statusText,
				headers: new Headers(res.headers),
			});
			next.headers.set("Access-Control-Allow-Origin", origin);
			next.headers.set(
				"Access-Control-Allow-Methods",
				"GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS",
			);
			next.headers.set(
				"Access-Control-Allow-Headers",
				"Content-Type, Authorization",
			);
			next.headers.set("Access-Control-Max-Age", "86400");
			return next;
		};

		if (event.request.method === "OPTIONS") {
			const res = new Response(null, { status: 204 });
			if (origin && isOriginAllowed(origin, allowlist)) {
				res.headers.set(
					"Access-Control-Allow-Origin",
					origin,
				);
				res.headers.set(
					"Access-Control-Allow-Methods",
					"GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS",
				);
				res.headers.set(
					"Access-Control-Allow-Headers",
					"Content-Type, Authorization",
				);
				res.headers.set(
					"Access-Control-Max-Age",
					"86400",
				);
			}
			return res;
		}

		const response = await resolve(event);
		return addCorsHeaders(response);
	};
};
