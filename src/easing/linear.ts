/**
 * Linear easing function - no acceleration or deceleration
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function linear(t: number): number {
  return t;
}

export type LinearEaseFunction = typeof linear;