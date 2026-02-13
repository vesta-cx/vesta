/**
 * Exponential easing functions
 */

/**
 * Ease-in exponential - starts slow, accelerates
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeInExponential(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * (t - 1));
}

/**
 * Ease-out exponential - starts fast, decelerates
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeOutExponential(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/**
 * Ease-in-out exponential - starts slow, accelerates, then decelerates
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeInOutExponential(t: number): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
  return (2 - Math.pow(2, -20 * t + 10)) / 2;
}

export type ExponentialEaseFunction = typeof easeInExponential | typeof easeOutExponential | typeof easeInOutExponential;