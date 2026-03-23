/** @format */

export type AppEnv = {
	Bindings: CloudflareBindings & {
		SHORT_LINKS: KVNamespace;
		CANONICAL_ORIGIN: string;
	};
};
