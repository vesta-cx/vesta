/** @format */

import { defineConfig } from "tsup";

export default defineConfig({
	cjsInterop: true,
	clean: true,

	entry: ["./src/**/*.[tj]s"],
	external: [
		"eslint",
		"prettier",
		"typescript",
		"eslint-plugin-markdown",
		"eslint-plugin-mdx",
		"eslint-plugin-jsonc",
		"eslint-plugin-svelte",
		"eslint-config-prettier",
		"prettier-plugin-svelte",
		"prettier-plugin-tailwindcss",
		"@typescript-eslint/utils",
		"@typescript-eslint/eslint-plugin",
		"@typescript-eslint/parser",
		"@vercel/style-guide",
		"@eslint/markdown",
		"@prettier/plugin-xml",
		"prettier-plugin-astro",
		"prettier-plugin-glsl",
		"prettier-plugin-nginx",
		"prettier-plugin-sh",
		"prettier-plugin-packagejson",
	],

	// experimentalDts: true,
	dts: true,

	format: ["cjs", "esm"],

	// minify: "terser",
	outDir: "dist/",

	splitting: false,
	target: ["esnext"],
	treeshake: "recommended",

	tsconfig: "./tsconfig.json",
});
