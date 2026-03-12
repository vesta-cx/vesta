declare global {
	namespace App {
		interface Platform {
			env: {
				DB: D1Database;
				ASSETS: Fetcher;
			};
			cf: IncomingRequestCfProperties;
			ctx: ExecutionContext;
			caches: CacheStorage;
		}
		// interface Error {}
		interface Locals {
			session: import('@vesta-cx/utils/auth').AuthSession | null;
		}
		// interface PageData {}
		// interface PageState {}
	}
}

export {};
