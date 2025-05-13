import { Configuration } from "lint-staged";
import base from "./base";

const typescript: Configuration = {
	...base,
	'*.{ts,tsx,cts,mts,js,jsx,cjs,mjs}': 'eslint',
};

export default typescript;