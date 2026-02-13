/**
 * Quadratic easing functions
 */

/**
 * Ease-in quadratic - starts slow, accelerates
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeInQuad(t: number): number {
  return t * t;
}

/**
 * Ease-out quadratic - starts fast, decelerates
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeOutQuad(t: number): number {
  return 1 - Math.pow(1 - t, 2);
}

/**
 * Ease-in-out quadratic - starts slow, accelerates, then decelerates
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export type QuadraticEaseFunction = typeof easeInQuad | typeof easeOutQuad | typeof easeInOutQuad;