import { TSESLint } from "@typescript-eslint/utils";
import base from "./base";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginJsonc from "eslint-plugin-jsonc";

export const json: TSESLint.FlatConfig.ConfigArray = [
	...base,
	...eslintPluginJsonc.configs["flat/recommended-with-json"],
	...eslintPluginJsonc.configs["flat/recommended-with-jsonc"],
	...eslintPluginJsonc.configs["flat/recommended-with-json5"],
	{
		files: ["*.json?([c5])"],
		rules: {
			//
		},
	},
];

export default [
	...new Set([
		...base,
		...json,
		...eslintPluginJsonc.configs["flat/prettier"],
		eslintConfigPrettier,
	]),
] as TSESLint.FlatConfig.ConfigArray;
