/**
 * Color space types
 */
export type ColorSpace = 'rgb' | 'hsl' | 'oklab' | 'oklch';

/**
 * Parsed color representation in different color spaces
 */
export type ParsedColor =
	| { space: 'rgb'; r: number; g: number; b: number; a: number }
	| { space: 'hsl'; h: number; s: number; l: number; a: number }
	| { space: 'oklab'; l: number; a: number; b: number; alpha: number }
	| { space: 'oklch'; l: number; c: number; h: number; alpha: number };

