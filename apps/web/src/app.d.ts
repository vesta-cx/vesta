declare global {
	namespace App {
		interface Platform {
			env: {
				DB: D1Database;
				ASSETS: Fetcher;
				PRIVATE_WORKOS_CLIENT_ID: string;
				PRIVATE_WORKOS_API_KEY: string;
				PRIVATE_WORKOS_ORG_ID?: string;
				PRIVATE_WORKOS_COOKIE_PASSWORD: string;
			};
			cf: IncomingRequestCfProperties;
			ctx: ExecutionContext;
			caches: CacheStorage;
		}
		// interface Error {}
		interface Locals {
			session: import('@vesta-cx/auth').AuthSession | null;
		}
		// interface PageData {}
		// interface PageState {}
	}
}

export {};
