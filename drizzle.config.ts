/** @format */

import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "./src/db/schema.ts",
	out: "../../packages/db/drizzle",
	dialect: "sqlite",
});
