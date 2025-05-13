import type { TSESLint } from "@typescript-eslint/utils";
import eslintConfigPrettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";
// @ts-ignore - @vercel/style-guide has no type definitions
import vercel from "@vercel/style-guide/eslint/_base";

export const base: TSESLint.FlatConfig.ConfigArray = [
	...tseslint.configs.recommended,
	vercel,
	{
		rules: {
			//
		},
	},
];

export default [
	...base,
	eslintConfigPrettier,
] as TSESLint.FlatConfig.ConfigArray;
