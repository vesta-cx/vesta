/**
 * Circular easing functions
 */

/**
 * Ease-in circular - starts slow, accelerates
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeInCircular(t: number): number {
  return 1 - Math.sqrt(1 - Math.pow(t, 2));
}

/**
 * Ease-out circular - starts fast, decelerates
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeOutCircular(t: number): number {
  return Math.sqrt(1 - Math.pow(t - 1, 2));
}

/**
 * Ease-in-out circular - starts slow, accelerates, then decelerates
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeInOutCircular(t: number): number {
  return t < 0.5
    ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
    : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2;
}

export type CircularEaseFunction = typeof easeInCircular | typeof easeOutCircular | typeof easeInOutCircular;