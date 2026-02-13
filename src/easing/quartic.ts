/**
 * Quartic easing functions
 */

/**
 * Ease-in quartic - starts slow, accelerates
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeInQuartic(t: number): number {
  return t * t * t * t;
}

/**
 * Ease-out quartic - starts fast, decelerates
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeOutQuartic(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

/**
 * Ease-in-out quartic - starts slow, accelerates, then decelerates
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeInOutQuartic(t: number): number {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

export type QuarticEaseFunction = typeof easeInQuartic | typeof easeOutQuartic | typeof easeInOutQuartic;