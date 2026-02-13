/**
 * Elastic easing functions
 * These functions create a bouncing/elastic effect
 */

const C4 = (2 * Math.PI) / 3;
const C5 = (2 * Math.PI) / 4.5;

/**
 * Ease-in elastic - starts slow with elastic effect
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeInElastic(t: number): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * C4);
}

/**
 * Ease-out elastic - ends with elastic effect
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeOutElastic(t: number): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * C4) + 1;
}

/**
 * Ease-in-out elastic - elastic effect at both ends
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeInOutElastic(t: number): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  if (t < 0.5) {
    return -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * C5)) / 2;
  }
  return (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * C5)) / 2 + 1;
}

export type ElasticEaseFunction = typeof easeInElastic | typeof easeOutElastic | typeof easeInOutElastic;