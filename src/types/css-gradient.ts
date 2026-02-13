import type { Color } from "../colors/css-colors";
import type { LengthUnit } from "./css-units";

export type Anchor = `top` | `bottom` | `left` | `right`;

export type Position = `${number}${LengthUnit} ${number}${LengthUnit}` | `at ${Anchor}` | `at ${Anchor} ${Anchor}`;

export type BaseGradientOptions = {
    type: "linear" | "radial";
    stops?: Array<`${Color} ${number}${LengthUnit}`>;
};

export type LinearGradientOptions = BaseGradientOptions & {
    type: "linear";
    angle: `${number}deg` | `to ${Anchor}` | `to ${Anchor} ${Anchor}`;
};

export type RadialGradientOptions = BaseGradientOptions & {
    type: "radial";
    position: Position;
};

export type GradientOptions = LinearGradientOptions | RadialGradientOptions;
