import { Configuration } from "lint-staged";

const base: Configuration = {
	'*': 'prettier --write',
}

export default base;