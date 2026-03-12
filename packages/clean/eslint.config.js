/** @format */

import base from "@vesta-cx/config/eslint";

export default [
	{ ignores: ["**/dist/**", "**/coverage/**", "**/node_modules/**"] },
	...base,
	{
		files: ["**/*.ts", "**/*.js", "**/*.cjs", "**/*.mjs"],
		rules: {
			"import/no-unresolved": "off",
			"import/no-default-export": "off",
			"no-console": "off",
			"unicorn/prefer-node-protocol": "off",
			"import/order": "off",
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
				},
			],
		},
	},
];
