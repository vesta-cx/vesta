/** @format */

import { Configuration } from "lint-staged";

const base: Configuration = {
	"*{.md,rc*,config,.json,.yaml}": ['prettier --ignore-path "" --write'],
};

export default base;
