/**
 * Easing functions for animations and transitions
 * All functions accept a value t between 0 and 1 and return an eased value between 0 and 1
 */

import type { BackEaseFunction } from "./back";
import type { BounceEaseFunction } from "./bounce";
import type { CircularEaseFunction } from "./circular";
import type { CubicEaseFunction } from "./cubic";
import type { ElasticEaseFunction } from "./elastic";
import type { ExponentialEaseFunction } from "./exponential";
import type { LinearEaseFunction } from "./linear";
import type { QuadraticEaseFunction } from "./quadratic";
import type { QuarticEaseFunction } from "./quartic";
import type { QuinticEaseFunction } from "./quintic";
import type { SineEaseFunction } from "./sine";

// Linear
export { linear } from "./linear";

// Quadratic
export { easeInOutQuad, easeInQuad, easeOutQuad } from "./quadratic";

// Cubic
export { easeInCubic, easeInOutCubic, easeOutCubic } from "./cubic";

// Quartic
export { easeInOutQuartic, easeInQuartic, easeOutQuartic } from "./quartic";

// Quintic
export { easeInOutQuintic, easeInQuintic, easeOutQuintic } from "./quintic";

// Sine
export { easeInOutSine, easeInSine, easeOutSine } from "./sine";

// Exponential
export { easeInExponential, easeInOutExponential, easeOutExponential } from "./exponential";

// Circular
export { easeInCircular, easeInOutCircular, easeOutCircular } from "./circular";

// Back (Overshoot)
export { easeInBack, easeInOutBack, easeOutBack } from "./back";

// Elastic
export { easeInElastic, easeInOutElastic, easeOutElastic } from "./elastic";

// Bounce
export { easeInBounce, easeInOutBounce, easeOutBounce } from "./bounce";

export type EaseFunction =
    | LinearEaseFunction
    | QuadraticEaseFunction
    | CubicEaseFunction
    | QuarticEaseFunction
    | QuinticEaseFunction
    | SineEaseFunction
    | ExponentialEaseFunction
    | CircularEaseFunction
    | BackEaseFunction
    | ElasticEaseFunction
    | BounceEaseFunction;

export type {
    BackEaseFunction,
    BounceEaseFunction,
    CircularEaseFunction,
    CubicEaseFunction,
    ElasticEaseFunction,
    ExponentialEaseFunction,
    LinearEaseFunction,
    QuadraticEaseFunction,
    QuarticEaseFunction,
    QuinticEaseFunction,
    SineEaseFunction,
};
