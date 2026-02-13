/**
 * Strips the unit from a formatted number, and returns an array of [number, unit]
 * If the number is not a number, returns [NaN, ""]
 * @param {string} value - The formatted number to strip the unit from
 * @returns {number, string} - An array of [number, unit]
 */
export function stripUnit(value: string): [number, string] {
    const number = parseFloat(value);
    const unit = value.replace(/[0-9.]/g, "");

    // if the number is NaN, return [NaN, ""]
    if (isNaN(number)) {
        return [NaN, ""];
    }

    return [number, unit];
}
