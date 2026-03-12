// NOTE: Don't use `/// <reference types="@sveltejs/adapter-cloudflare" />` here.
// The adapter's ambient.d.ts declares `env: unknown` which prevents overriding
// via interface merging. Runtime types come from worker-configuration.d.ts
// (included via tsconfig "types").

declare global {
	namespace App {
		interface Platform {
			env: {
				DB: D1Database;
				AUDIO_BUCKET: R2Bucket;
				ASSETS: Fetcher;
				PRIVATE_WORKOS_CLIENT_ID: string;
				PRIVATE_WORKOS_API_KEY: string;
				PRIVATE_WORKOS_ORG_ID: string;
				PRIVATE_WORKOS_COOKIE_PASSWORD: string;
				EUTERPE_URL?: string;
				PRIVATE_EUTERPE_API_KEY?: string;
				PRIVATE_R2_ACCOUNT_ID?: string;
				PRIVATE_R2_ACCESS_KEY_ID?: string;
				PRIVATE_R2_SECRET_ACCESS_KEY?: string;
				PRIVATE_R2_BUCKET?: string;
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
