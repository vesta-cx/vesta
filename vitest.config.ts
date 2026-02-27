/** @format */

import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		include: ["src/**/*.test.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json-summary", "html"],
			reportsDirectory: "coverage",
			thresholds: {
				lines: 68,
				functions: 62,
				branches: 48,
				statements: 64,
			},
		},
	},
	esbuild: {
		tsconfigRaw: {
			compilerOptions: {
				target: "ES2022",
				module: "ESNext",
				moduleResolution: "Bundler",
			},
		},
	},
});
