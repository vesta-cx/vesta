/** @format */

import type { TSESLint } from "@typescript-eslint/utils";
import babelParser from "@babel/eslint-parser";
// @ts-expect-error - package has no bundled type declarations
import eslintPluginEslintComments from "eslint-plugin-eslint-comments";
import eslintPluginImport from "eslint-plugin-import";
// @ts-expect-error - package has no bundled type declarations
import eslintPluginUnicorn from "eslint-plugin-unicorn";

const importRecommended =
	"flatConfigs" in eslintPluginImport &&
	eslintPluginImport.flatConfigs &&
	"recommended" in eslintPluginImport.flatConfigs
		? [eslintPluginImport.flatConfigs.recommended]
		: ([] as TSESLint.FlatConfig.ConfigArray);

const importPlugin =
	eslintPluginImport as unknown as TSESLint.FlatConfig.Plugin;
const eslintCommentsPlugin =
	eslintPluginEslintComments as unknown as TSESLint.FlatConfig.Plugin;
const unicornPlugin =
	eslintPluginUnicorn as unknown as TSESLint.FlatConfig.Plugin;

export const vercelFlatCompat: TSESLint.FlatConfig.ConfigArray = [
	...importRecommended,
	{
		languageOptions: {
			ecmaVersion: 2021,
			sourceType: "module",
		},
		linterOptions: {
			reportUnusedDisableDirectives: "error",
		},
		settings: {
			"import/resolver": { node: {} },
		},
		plugins: {
			import: importPlugin,
			"eslint-comments": eslintCommentsPlugin,
			unicorn: unicornPlugin,
		},
		rules: {
			"array-callback-return": ["error", { allowImplicit: true }],
			"block-scoped-var": "error",
			curly: ["warn", "multi-line"],
			"default-case-last": "error",
			eqeqeq: "error",
			"grouped-accessor-pairs": "error",
			"no-alert": "error",
			"no-caller": "error",
			"no-constructor-return": "error",
			"no-else-return": "warn",
			"no-eval": "error",
			"no-extend-native": "error",
			"no-extra-bind": "error",
			"no-extra-label": "error",
			"no-floating-decimal": "error",
			"no-implicit-coercion": "error",
			"no-implied-eval": "error",
			"no-iterator": "error",
			"no-labels": ["error"],
			"no-lone-blocks": "error",
			"no-new": "error",
			"no-new-func": "error",
			"no-new-wrappers": "error",
			"no-octal-escape": "error",
			"no-param-reassign": "error",
			"no-proto": "error",
			"no-return-assign": "error",
			"no-script-url": "error",
			"no-self-compare": "error",
			"no-sequences": "error",
			"no-useless-call": "error",
			"no-useless-concat": "error",
			"no-useless-return": "warn",
			"prefer-named-capture-group": "error",
			"prefer-promise-reject-errors": [
				"error",
				{ allowEmptyReject: true },
			],
			"prefer-regex-literals": "error",
			yoda: "warn",

			"eslint-comments/require-description": "error",

			"no-useless-computed-key": "warn",
			"no-useless-rename": "warn",
			"no-var": "error",
			"object-shorthand": "warn",
			"prefer-const": "warn",
			"prefer-numeric-literals": "error",
			"prefer-rest-params": "error",
			"prefer-spread": "error",
			"prefer-template": "warn",
			"symbol-description": "error",

			"import/first": "error",
			"import/newline-after-import": "warn",
			"import/no-absolute-path": "error",
			"import/no-cycle": "error",
			"import/no-default-export": "error",
			"import/no-extraneous-dependencies": [
				"error",
				{ includeTypes: true },
			],
			"import/no-mutable-exports": "error",
			"import/no-relative-packages": "warn",
			"import/no-self-import": "error",
			"import/no-useless-path-segments": ["error"],
			"import/order": [
				"warn",
				{
					groups: [
						"builtin",
						"external",
						"internal",
						"parent",
						"sibling",
						"index",
					],
					"newlines-between": "never",
				},
			],

			"no-console": "error",
			"no-constant-binary-expression": "error",
			"no-promise-executor-return": "error",
			"no-template-curly-in-string": "error",
			"no-unreachable-loop": "error",

			camelcase: [
				"error",
				{
					allow: ["^UNSAFE_"],
					ignoreDestructuring: false,
					properties: "never",
				},
			],
			"func-names": ["error", "as-needed"],
			"new-cap": ["error", { capIsNew: false }],
			"new-parens": "warn",
			"no-array-constructor": "error",
			"no-bitwise": "error",
			"no-lonely-if": "warn",
			"no-multi-assign": ["error"],
			"no-nested-ternary": "error",
			"no-unneeded-ternary": "error",
			"prefer-object-spread": "warn",

			"unicorn/filename-case": [
				"error",
				{
					case: "kebabCase",
				},
			],
			"unicorn/prefer-node-protocol": "warn",

			"no-label-var": "error",
			"no-undef-init": "warn",
		},
	},
	{
		files: ["*.js?(x)", "*.mjs"],
		languageOptions: {
			parser: babelParser as unknown as TSESLint.FlatConfig.Parser,
			parserOptions: {
				requireConfigFile: false,
			},
		},
		rules: {
			"no-unused-vars": [
				"error",
				{
					args: "after-used",
					argsIgnorePattern: "^_",
					ignoreRestSiblings: false,
					vars: "all",
					varsIgnorePattern: "^_",
				},
			],
		},
	},
];
