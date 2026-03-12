/** @format */

// Explicit path to built config so the Prettier VS Code extension’s resolver
// doesn’t request the package’s unexported ./src/prettier/base.ts
import base from "@vesta-cx/config/prettier";

/** @type {import("prettier").Config} */
const config = {
	...base,
	overrides: [
		...base.overrides,
		{
			// JSONC - no trailing commas
			files: ["*.jsonc"],
			options: {
				trailingComma: "none",
			},
		},
	],
};

export default config;
