/**
 * Sine easing functions
 */

/**
 * Ease-in sine - starts slow, accelerates
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeInSine(t: number): number {
  return 1 - Math.cos((t * Math.PI) / 2);
}

/**
 * Ease-out sine - starts fast, decelerates
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeOutSine(t: number): number {
  return Math.sin((t * Math.PI) / 2);
}

/**
 * Ease-in-out sine - starts slow, accelerates, then decelerates
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

export type SineEaseFunction = typeof easeInSine | typeof easeOutSine | typeof easeInOutSine;