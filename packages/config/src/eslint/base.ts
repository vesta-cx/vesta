/** @format */

import type { TSESLint } from "@typescript-eslint/utils";
import eslintConfigPrettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";
import { vercelFlatCompat } from "./vercel-flat";

export const base: TSESLint.FlatConfig.ConfigArray = [
	...tseslint.configs.recommended,
	...vercelFlatCompat,
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
