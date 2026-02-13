/**
 * Bounce easing functions
 * These functions create a bouncing effect
 */

const N1 = 7.5625;
const D1 = 2.75;

/**
 * Ease-in bounce - ends with bounce
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeInBounce(t: number): number {
  return 1 - easeOutBounce(1 - t);
}

/**
 * Ease-out bounce - ends with bounce
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeOutBounce(t: number): number {
  if (t < 1 / D1) {
    return N1 * t * t;
  } else if (t < 2 / D1) {
    return N1 * (t -= 1.5 / D1) * t + 0.75;
  } else if (t < 2.5 / D1) {
    return N1 * (t -= 2.25 / D1) * t + 0.9375;
  } else {
    return N1 * (t -= 2.625 / D1) * t + 0.984375;
  }
}

/**
 * Ease-in-out bounce - bounces at both ends
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeInOutBounce(t: number): number {
  return t < 0.5
    ? (1 - easeOutBounce(1 - 2 * t)) / 2
    : (1 + easeOutBounce(2 * t - 1)) / 2;
}

export type BounceEaseFunction = typeof easeInBounce | typeof easeOutBounce | typeof easeInOutBounce;