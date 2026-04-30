/** @format */

import { defineConfig } from "drizzle-kit";

/**
 * Erato shares the D1 schema with @vesta-cx/db. Point drizzle-kit at the
 * package source directly because the workspace package only exports the
 * `import` condition; drizzle-kit's CJS bundler hits
 * ERR_PACKAGE_PATH_NOT_EXPORTED otherwise.
 */
export default defineConfig({
	schema: "../../packages/db/src/schema/index.ts",
	out: "../../packages/db/drizzle",
	dialect: "sqlite",
});
