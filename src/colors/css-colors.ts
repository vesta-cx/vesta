export type RGBColor = `rgb(${number}${`, ` | `,`}${number}${`, ` | `,`}${number})`;
export type RGBAColor = `rgba(${number}${`, ` | `,`}${number}${`, ` | `,`}${number}${`, ` | `,`}${number})`;
export type HSLColor = `hsl(${number}${`, ` | `,`}${number}%, ${number}%)`;
export type HSLAColor = `hsla(${number}${`, ` | `,`}${number}%${`, ` | `,`}${number}%${`, ` | `,`}${number})`;
export type OKLabColor = `oklab(${number} ${number} ${number})`;
export type OKLabAColor = `oklab(${number} ${number} ${number}${` / ` | ` /` | `/` | ` `}${number})`;
export type OKLCHColor = `oklch(${number} ${number} ${number})`;
export type OKLCHAColor = `oklch(${number} ${number} ${number}${` / ` | ` /` | `/` | ` `}${number})`;
export type HexColor = `#${string}`;
export type CSSVariable = `var(--${string})`;
export type Transparent = "transparent";

export type Color =
    | RGBColor
    | RGBAColor
    | HSLColor
    | HSLAColor
    | OKLabColor
    | OKLabAColor
    | OKLCHColor
    | OKLCHAColor
    | HexColor
    | CSSVariable
    | Transparent;
