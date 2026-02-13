import { describe, it, expect } from "vitest";
import {
    linear,
    easeInQuad,
    easeOutQuad,
    easeInOutQuad,
    easeInCubic,
    easeOutCubic,
    easeInOutCubic,
    easeInQuartic,
    easeOutQuartic,
    easeInOutQuartic,
    easeInQuintic,
    easeOutQuintic,
    easeInOutQuintic,
    easeInSine,
    easeOutSine,
    easeInOutSine,
    easeInExponential,
    easeOutExponential,
    easeInOutExponential,
    easeInCircular,
    easeOutCircular,
    easeInOutCircular,
    easeInBack,
    easeOutBack,
    easeInOutBack,
    easeInElastic,
    easeOutElastic,
    easeInOutElastic,
    easeInBounce,
    easeOutBounce,
    easeInOutBounce,
} from "../src/easing/index";

describe("Easing Functions", () => {
    describe("Edge Cases", () => {
        const allEasingFunctions = [
            { name: "linear", fn: linear },
            { name: "easeInQuad", fn: easeInQuad },
            { name: "easeOutQuad", fn: easeOutQuad },
            { name: "easeInOutQuad", fn: easeInOutQuad },
            { name: "easeInCubic", fn: easeInCubic },
            { name: "easeOutCubic", fn: easeOutCubic },
            { name: "easeInOutCubic", fn: easeInOutCubic },
            { name: "easeInQuartic", fn: easeInQuartic },
            { name: "easeOutQuartic", fn: easeOutQuartic },
            { name: "easeInOutQuartic", fn: easeInOutQuartic },
            { name: "easeInQuintic", fn: easeInQuintic },
            { name: "easeOutQuintic", fn: easeOutQuintic },
            { name: "easeInOutQuintic", fn: easeInOutQuintic },
            { name: "easeInSine", fn: easeInSine },
            { name: "easeOutSine", fn: easeOutSine },
            { name: "easeInOutSine", fn: easeInOutSine },
            { name: "easeInExponential", fn: easeInExponential },
            { name: "easeOutExponential", fn: easeOutExponential },
            { name: "easeInOutExponential", fn: easeInOutExponential },
            { name: "easeInCircular", fn: easeInCircular },
            { name: "easeOutCircular", fn: easeOutCircular },
            { name: "easeInOutCircular", fn: easeInOutCircular },
            { name: "easeInBack", fn: easeInBack },
            { name: "easeOutBack", fn: easeOutBack },
            { name: "easeInOutBack", fn: easeInOutBack },
            { name: "easeInElastic", fn: easeInElastic },
            { name: "easeOutElastic", fn: easeOutElastic },
            { name: "easeInOutElastic", fn: easeInOutElastic },
            { name: "easeInBounce", fn: easeInBounce },
            { name: "easeOutBounce", fn: easeOutBounce },
            { name: "easeInOutBounce", fn: easeInOutBounce },
        ];

        it("should return 0 when t = 0", () => {
            allEasingFunctions.forEach(({ name, fn }) => {
                const result = fn(0);
                expect(result, `${name}(0) should be 0`).toBeCloseTo(0, 10);
            });
        });

        it("should return 1 when t = 1", () => {
            allEasingFunctions.forEach(({ name, fn }) => {
                const result = fn(1);
                expect(result, `${name}(1) should be 1`).toBeCloseTo(1, 10);
            });
        });

        it("should return reasonable values for t in [0, 1]", () => {
            const testValues = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1];
            // Functions that can overshoot (back, elastic, bounce)
            const overshootFunctions = [
                "easeInBack",
                "easeOutBack",
                "easeInOutBack",
                "easeInElastic",
                "easeOutElastic",
                "easeInOutElastic",
                "easeInBounce",
                "easeOutBounce",
                "easeInOutBounce",
            ];

            allEasingFunctions.forEach(({ name, fn }) => {
                testValues.forEach((t) => {
                    const result = fn(t);
                    if (overshootFunctions.includes(name)) {
                        // Overshoot functions can go slightly outside [0, 1]
                        expect(result, `${name}(${t}) should be reasonable (overshoot allowed)`).toBeGreaterThanOrEqual(
                            -1,
                        );
                        expect(result, `${name}(${t}) should be reasonable (overshoot allowed)`).toBeLessThanOrEqual(2);
                    } else {
                        // Standard functions should stay within [0, 1]
                        expect(result, `${name}(${t}) should be between 0 and 1`).toBeGreaterThanOrEqual(0);
                        expect(result, `${name}(${t}) should be between 0 and 1`).toBeLessThanOrEqual(1);
                    }
                });
            });
        });
    });

    describe("Linear", () => {
        it("should return the input value", () => {
            expect(linear(0)).toBe(0);
            expect(linear(0.5)).toBe(0.5);
            expect(linear(1)).toBe(1);
        });
    });

    describe("Quadratic", () => {
        it("easeInQuad should start slow", () => {
            expect(easeInQuad(0.25)).toBe(0.0625);
            expect(easeInQuad(0.5)).toBe(0.25);
        });

        it("easeOutQuad should end slow", () => {
            expect(easeOutQuad(0.5)).toBe(0.75);
            expect(easeOutQuad(0.75)).toBe(0.9375);
        });

        it("easeInOutQuad should be symmetric", () => {
            expect(easeInOutQuad(0.25)).toBeCloseTo(1 - easeInOutQuad(0.75), 5);
            expect(easeInOutQuad(0.5)).toBe(0.5);
        });

        it("easeOutQuad should match Material Design scrim requirement", () => {
            // Material Design: 50% brightness at ~30% progress
            const result = easeOutQuad(0.3);
            expect(result).toBeCloseTo(0.51, 2);
        });
    });

    describe("Cubic", () => {
        it("easeInCubic should start slower than quadratic", () => {
            expect(easeInCubic(0.5)).toBe(0.125);
            expect(easeInCubic(0.5)).toBeLessThan(easeInQuad(0.5));
        });

        it("easeOutCubic should end slower than quadratic", () => {
            expect(easeOutCubic(0.5)).toBe(0.875);
            expect(easeOutCubic(0.5)).toBeGreaterThan(easeOutQuad(0.5));
        });

        it("easeInOutCubic should be symmetric", () => {
            expect(easeInOutCubic(0.25)).toBeCloseTo(1 - easeInOutCubic(0.75), 5);
            expect(easeInOutCubic(0.5)).toBe(0.5);
        });
    });

    describe("Quartic", () => {
        it("easeInQuartic should start slower than cubic", () => {
            expect(easeInQuartic(0.5)).toBe(0.0625);
            expect(easeInQuartic(0.5)).toBeLessThan(easeInCubic(0.5));
        });

        it("easeOutQuartic should end slower than cubic", () => {
            expect(easeOutQuartic(0.5)).toBe(0.9375);
            expect(easeOutQuartic(0.5)).toBeGreaterThan(easeOutCubic(0.5));
        });
    });

    describe("Quintic", () => {
        it("easeInQuintic should start slower than quartic", () => {
            expect(easeInQuintic(0.5)).toBe(0.03125);
            expect(easeInQuintic(0.5)).toBeLessThan(easeInQuartic(0.5));
        });

        it("easeOutQuintic should end slower than quartic", () => {
            expect(easeOutQuintic(0.5)).toBe(0.96875);
            expect(easeOutQuintic(0.5)).toBeGreaterThan(easeOutQuartic(0.5));
        });
    });

    describe("Sine", () => {
        it("easeInSine should have correct values", () => {
            expect(easeInSine(0.5)).toBeCloseTo(0.2929, 3);
        });

        it("easeOutSine should have correct values", () => {
            expect(easeOutSine(0.5)).toBeCloseTo(0.7071, 3);
        });

        it("easeInOutSine should be symmetric", () => {
            expect(easeInOutSine(0.25)).toBeCloseTo(1 - easeInOutSine(0.75), 5);
            expect(easeInOutSine(0.5)).toBeCloseTo(0.5, 10);
        });
    });

    describe("Exponential", () => {
        it("easeInExponential should handle edge cases", () => {
            expect(easeInExponential(0)).toBe(0);
            expect(easeInExponential(1)).toBe(1);
            expect(easeInExponential(0.5)).toBeCloseTo(0.03125, 5);
        });

        it("easeOutExponential should handle edge cases", () => {
            expect(easeOutExponential(0)).toBe(0);
            expect(easeOutExponential(1)).toBe(1);
            expect(easeOutExponential(0.5)).toBeCloseTo(0.96875, 5);
        });

        it("easeInOutExponential should handle edge cases", () => {
            expect(easeInOutExponential(0)).toBe(0);
            expect(easeInOutExponential(1)).toBe(1);
            expect(easeInOutExponential(0.5)).toBe(0.5);
        });
    });

    describe("Circular", () => {
        it("easeInCircular should have correct values", () => {
            expect(easeInCircular(0.5)).toBeCloseTo(0.134, 3);
        });

        it("easeOutCircular should have correct values", () => {
            expect(easeOutCircular(0.5)).toBeCloseTo(0.866, 3);
        });

        it("easeInOutCircular should be symmetric", () => {
            expect(easeInOutCircular(0.25)).toBeCloseTo(1 - easeInOutCircular(0.75), 5);
            expect(easeInOutCircular(0.5)).toBe(0.5);
        });
    });

    describe("Back (Overshoot)", () => {
        it("easeInBack should overshoot below 0", () => {
            const result = easeInBack(0.1);
            expect(result).toBeLessThan(0);
            expect(result).toBeGreaterThan(-0.1);
        });

        it("easeOutBack should overshoot above 1", () => {
            const result = easeOutBack(0.9);
            expect(result).toBeGreaterThan(1);
            expect(result).toBeLessThan(1.1);
        });

        it("easeInOutBack should be symmetric", () => {
            expect(easeInOutBack(0.25)).toBeCloseTo(1 - easeInOutBack(0.75), 5);
            expect(easeInOutBack(0.5)).toBeCloseTo(0.5, 10);
        });

        it("should handle edge cases correctly", () => {
            expect(easeInBack(0)).toBeCloseTo(0, 10);
            expect(easeInBack(1)).toBeCloseTo(1, 10);
            expect(easeOutBack(0)).toBeCloseTo(0, 10);
            expect(easeOutBack(1)).toBeCloseTo(1, 10);
        });
    });

    describe("Elastic", () => {
        it("easeInElastic should oscillate below 0", () => {
            const result = easeInElastic(0.3);
            expect(result).toBeLessThan(0);
            expect(result).toBeGreaterThan(-1);
        });

        it("easeOutElastic should oscillate above 1", () => {
            const result = easeOutElastic(0.7);
            expect(result).toBeGreaterThan(1);
            expect(result).toBeLessThan(2);
        });

        it("easeInOutElastic should handle edge cases", () => {
            expect(easeInOutElastic(0)).toBe(0);
            expect(easeInOutElastic(1)).toBe(1);
            expect(easeInOutElastic(0.5)).toBe(0.5);
        });

        it("should handle edge cases correctly", () => {
            expect(easeInElastic(0)).toBe(0);
            expect(easeInElastic(1)).toBe(1);
            expect(easeOutElastic(0)).toBe(0);
            expect(easeOutElastic(1)).toBe(1);
        });
    });

    describe("Bounce", () => {
        it("easeOutBounce should stay within bounds", () => {
            // Bounce functions should stay within [0, 1] for valid inputs
            const result = easeOutBounce(0.6);
            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThanOrEqual(1);
        });

        it("easeInBounce should be inverse of easeOutBounce", () => {
            expect(easeInBounce(0.3)).toBeCloseTo(1 - easeOutBounce(0.7), 2);
            expect(easeInBounce(0.5)).toBeCloseTo(1 - easeOutBounce(0.5), 2);
        });

        it("easeInOutBounce should be symmetric", () => {
            expect(easeInOutBounce(0.25)).toBeCloseTo(1 - easeInOutBounce(0.75), 2);
            expect(easeInOutBounce(0.5)).toBe(0.5);
        });

        it("should handle edge cases correctly", () => {
            expect(easeInBounce(0)).toBe(0);
            expect(easeInBounce(1)).toBe(1);
            expect(easeOutBounce(0)).toBe(0);
            expect(easeOutBounce(1)).toBe(1);
            expect(easeInOutBounce(0)).toBe(0);
            expect(easeInOutBounce(1)).toBe(1);
        });
    });

    describe("Monotonicity", () => {
        it("ease-in functions should be monotonic increasing", () => {
            // Back functions overshoot, so they're not strictly monotonic
            const easeInFunctions = [
                easeInQuad,
                easeInCubic,
                easeInQuartic,
                easeInQuintic,
                easeInSine,
                easeInExponential,
                easeInCircular,
            ];

            const testPoints = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];

            easeInFunctions.forEach((fn) => {
                for (let i = 1; i < testPoints.length; i++) {
                    const prev = fn(testPoints[i - 1]);
                    const curr = fn(testPoints[i]);
                    expect(curr, `Function should be monotonic increasing at ${testPoints[i]}`).toBeGreaterThanOrEqual(
                        prev,
                    );
                }
            });
        });

        it("ease-out functions should be monotonic increasing", () => {
            // Back functions overshoot, so they're not strictly monotonic
            const easeOutFunctions = [
                easeOutQuad,
                easeOutCubic,
                easeOutQuartic,
                easeOutQuintic,
                easeOutSine,
                easeOutExponential,
                easeOutCircular,
            ];

            const testPoints = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];

            easeOutFunctions.forEach((fn) => {
                for (let i = 1; i < testPoints.length; i++) {
                    const prev = fn(testPoints[i - 1]);
                    const curr = fn(testPoints[i]);
                    expect(curr, `Function should be monotonic increasing at ${testPoints[i]}`).toBeGreaterThanOrEqual(
                        prev,
                    );
                }
            });
        });

        it("ease-in-out functions should be monotonic increasing", () => {
            // Back functions overshoot, so they're not strictly monotonic
            const easeInOutFunctions = [
                easeInOutQuad,
                easeInOutCubic,
                easeInOutQuartic,
                easeInOutQuintic,
                easeInOutSine,
                easeInOutExponential,
                easeInOutCircular,
            ];

            const testPoints = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];

            easeInOutFunctions.forEach((fn) => {
                for (let i = 1; i < testPoints.length; i++) {
                    const prev = fn(testPoints[i - 1]);
                    const curr = fn(testPoints[i]);
                    expect(curr, `Function should be monotonic increasing at ${testPoints[i]}`).toBeGreaterThanOrEqual(
                        prev,
                    );
                }
            });
        });
    });
});
