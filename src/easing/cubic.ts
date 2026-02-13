/**
 * Cubic easing functions
 */

/**
 * Ease-in cubic - starts slow, accelerates
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeInCubic(t: number): number {
    return t * t * t;
}

/**
 * Ease-out cubic - starts fast, decelerates
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
}

/**
 * Ease-in-out cubic - starts slow, accelerates, then decelerates
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export type CubicEaseFunction = typeof easeInCubic | typeof easeOutCubic | typeof easeInOutCubic;