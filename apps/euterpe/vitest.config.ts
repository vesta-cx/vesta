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
				lines: 92,
				functions: 90,
				branches: 63,
				statements: 88,
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
