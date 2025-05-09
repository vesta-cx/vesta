/** @param {number | string} value
 * @returns {[number, string]}
 */
export function split_css_unit(value: number | string): [number, string] {
	if (typeof value === 'number') return [value, 'px'];

	const split = typeof value === 'string' && value.match(/^\s*(-?[\d.]+)([^\s]*)\s*$/);
	if (!split) return [parseFloat(value), 'px'];
	else return [parseFloat(split[1]), split[2]];
}

export default split_css_unit;
