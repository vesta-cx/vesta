/**
 * Back (overshoot) easing functions
 * These functions create an overshoot effect
 */

const C1 = 1.70158;
const C2 = C1 * 1.525;
const C3 = C1 + 1;

/**
 * Ease-in back - starts slow, accelerates with overshoot
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeInBack(t: number): number {
    return C3 * t * t * t - C1 * t * t;
}

/**
 * Ease-out back - starts fast, decelerates with overshoot
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeOutBack(t: number): number {
    return 1 + C3 * Math.pow(t - 1, 3) + C1 * Math.pow(t - 1, 2);
}

/**
 * Ease-in-out back - starts slow, accelerates, then decelerates with overshoot
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 */
export function easeInOutBack(t: number): number {
    return t < 0.5
        ? (Math.pow(2 * t, 2) * ((C2 + 1) * 2 * t - C2)) / 2
        : (Math.pow(2 * t - 2, 2) * ((C2 + 1) * (t * 2 - 2) + C2) + 2) / 2;
}

export type BackEaseFunction = typeof easeInBack | typeof easeOutBack | typeof easeInOutBack;
