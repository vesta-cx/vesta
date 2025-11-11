// Relative Length Units

export type FontRelativeLengthUnit = "cap" | "ch" | `e${"m" | "x"}` | "ic" | "lh";
export type RootFontRelativeLengthUnit = `r${FontRelativeLengthUnit}`;

export type LengthDimension = "w" | "h" | "min" | "max" | "b" | "i";

export type ViewportRelativeLengthUnit = `${"d" | "s" | "l"}v${LengthDimension}`;
export type ContainerQueryLengthUnit = `c${LengthDimension}`;

export type RelativeLengthUnit = FontRelativeLengthUnit | RootFontRelativeLengthUnit | ViewportRelativeLengthUnit | ContainerQueryLengthUnit;

// Absolute Length Units

export type PixelLengthUnit = `px`;
export type CentimeterLengthUnit = `cm`;
export type MillimeterLengthUnit = `mm`;
export type QuarterMillimeterLengthUnit = `Q`;
export type InchLengthUnit = `in`;
export type PicaLengthUnit = `pc`;
export type PointLengthUnit = `pt`;

export type AbsoluteLengthUnit = PixelLengthUnit | CentimeterLengthUnit | MillimeterLengthUnit | QuarterMillimeterLengthUnit | InchLengthUnit | PicaLengthUnit | PointLengthUnit;

export type LengthUnit = RelativeLengthUnit | AbsoluteLengthUnit;
