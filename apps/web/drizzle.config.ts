import { defineConfig } from 'drizzle-kit';

/**
 * Web shares the D1 schema with @vesta-cx/db — the schema lives once,
 * migrations are generated into the shared `packages/db/drizzle` folder
 * so erato and web stay in lockstep.
 *
 * We point drizzle-kit at the package source rather than going through
 * `@vesta-cx/db` because that package only exports the `import` condition
 * and drizzle-kit's CJS bundler can't load it (ERR_PACKAGE_PATH_NOT_EXPORTED).
 */
export default defineConfig({
	schema: '../../packages/db/src/schema/index.ts',
	out: '../../packages/db/drizzle',
	dialect: 'sqlite'
});
