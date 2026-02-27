/** @format */

import { Configuration } from "lint-staged";
import base from "./base";

const typescript: Configuration = {
	...base,
	"*.{ts,tsx,cts,mts,js,jsx,cjs,mjs}": [
		'prettier --ignore-path "" --write',
		// "eslint",
	],
};

export default typescript;
