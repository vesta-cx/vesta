/** @format */

import { TSESLint } from "@typescript-eslint/utils";
import base from "./base";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginJsonc from "eslint-plugin-jsonc";

const jsonConfigs = [
	...eslintPluginJsonc.configs["flat/recommended-with-json"],
	...eslintPluginJsonc.configs["flat/recommended-with-jsonc"],
	...eslintPluginJsonc.configs["flat/recommended-with-json5"],
] as TSESLint.FlatConfig.ConfigArray;

export const json: TSESLint.FlatConfig.ConfigArray = [
	...base,
	...jsonConfigs,
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
		...(eslintPluginJsonc.configs[
			"flat/prettier"
		] as TSESLint.FlatConfig.ConfigArray),
		eslintConfigPrettier,
	]),
] as TSESLint.FlatConfig.ConfigArray;
