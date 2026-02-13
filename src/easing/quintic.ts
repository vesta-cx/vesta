/**
 * Quintic easing functions
 */

/**
 * Ease-in quintic - starts slow, accelerates
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeInQuintic(t: number): number {
  return t * t * t * t * t;
}

/**
 * Ease-out quintic - starts fast, decelerates
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeOutQuintic(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}

/**
 * Ease-in-out quintic - starts slow, accelerates, then decelerates
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeInOutQuintic(t: number): number {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
}

export type QuinticEaseFunction = typeof easeInQuintic | typeof easeOutQuintic | typeof easeInOutQuintic;