/** @format */

import { defineConfig } from "tsup";

export default defineConfig({
	cjsInterop: true,
	clean: true,

	entry: {
		index: "./src/index.ts",
		cli: "./src/cli.ts",
	},
	external: [],

	dts: true,

	format: ["cjs", "esm"],

	outDir: "dist/",

	splitting: false,
	target: ["esnext"],
	treeshake: "recommended",

	tsconfig: "./tsconfig.json",
});
