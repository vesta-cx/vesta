import type { ParsedColor } from './types';

/**
 * Interpolate hue values, handling circular wrapping (0-360 degrees)
 * Takes the shorter path around the color wheel
 *
 * @param h1 - Starting hue in degrees
 * @param h2 - Ending hue in degrees
 * @param t - Interpolation factor (0 to 1)
 * @returns Interpolated hue value
 */
export function interpolateHue(h1: number, h2: number, t: number): number {
	const diff = h2 - h1;
	const absDiff = Math.abs(diff);

	if (absDiff <= 180) {
		return h1 + diff * t;
	}

	// Take the shorter path around the circle
	if (diff > 0) {
		return h1 + (diff - 360) * t;
	} else {
		return h1 + (diff + 360) * t;
	}
}

/**
 * Get alpha value from a ParsedColor, handling different color space formats
 */
function getAlpha(color: ParsedColor): number {
	if (color.space === 'rgb' || color.space === 'hsl') {
		return color.a;
	}
	if (color.space === 'oklab' || color.space === 'oklch') {
		return color.alpha;
	}
	return 0;
}

/**
 * Interpolate between two colors in their native color space
 * If colors are in different spaces, interpolates only alpha in fromColor's space
 *
 * @param from - Starting color
 * @param to - Ending color
 * @param t - Interpolation factor (0 to 1)
 * @returns CSS color string in the same format as fromColor
 */
export function interpolateColor(from: ParsedColor, to: ParsedColor, t: number): string {
	const space = from.space;

	// Same color space - full interpolation
	if (space === 'rgb' && to.space === 'rgb') {
		const r = Math.round(from.r + (to.r - from.r) * t);
		const g = Math.round(from.g + (to.g - from.g) * t);
		const b = Math.round(from.b + (to.b - from.b) * t);
		const a = from.a + (to.a - from.a) * t;
		return `rgba(${r}, ${g}, ${b}, ${a})`;
	}

	if (space === 'hsl' && to.space === 'hsl') {
		const h = interpolateHue(from.h, to.h, t);
		const s = from.s + (to.s - from.s) * t;
		const l = from.l + (to.l - from.l) * t;
		const a = from.a + (to.a - from.a) * t;
		return `hsla(${h.toFixed(2)}, ${(s * 100).toFixed(2)}%, ${(l * 100).toFixed(2)}%, ${a})`;
	}

	if (space === 'oklab' && to.space === 'oklab') {
		const l = from.l + (to.l - from.l) * t;
		const a = from.a + (to.a - from.a) * t;
		const b = from.b + (to.b - from.b) * t;
		const alpha = from.alpha + (to.alpha - from.alpha) * t;
		return alpha === 1
			? `oklab(${l.toFixed(4)} ${a.toFixed(4)} ${b.toFixed(4)})`
			: `oklab(${l.toFixed(4)} ${a.toFixed(4)} ${b.toFixed(4)} / ${alpha})`;
	}

	if (space === 'oklch' && to.space === 'oklch') {
		const l = from.l + (to.l - from.l) * t;
		const c = from.c + (to.c - from.c) * t;
		const h = interpolateHue(from.h, to.h, t);
		const alpha = from.alpha + (to.alpha - from.alpha) * t;
		return alpha === 1
			? `oklch(${l.toFixed(4)} ${c.toFixed(4)} ${h.toFixed(2)})`
			: `oklch(${l.toFixed(4)} ${c.toFixed(4)} ${h.toFixed(2)} / ${alpha})`;
	}

	// Mismatched color spaces: interpolate only alpha in fromColor's space
	const toAlpha = getAlpha(to);

	if (space === 'rgb') {
		const a = from.a + (toAlpha - from.a) * t;
		return `rgba(${from.r}, ${from.g}, ${from.b}, ${a})`;
	}

	if (space === 'hsl') {
		const a = from.a + (toAlpha - from.a) * t;
		return `hsla(${from.h.toFixed(2)}, ${(from.s * 100).toFixed(2)}%, ${(from.l * 100).toFixed(2)}%, ${a})`;
	}

	if (space === 'oklab') {
		const alpha = from.alpha + (toAlpha - from.alpha) * t;
		return alpha === 1
			? `oklab(${from.l.toFixed(4)} ${from.a.toFixed(4)} ${from.b.toFixed(4)})`
			: `oklab(${from.l.toFixed(4)} ${from.a.toFixed(4)} ${from.b.toFixed(4)} / ${alpha})`;
	}

	if (space === 'oklch') {
		const alpha = from.alpha + (toAlpha - from.alpha) * t;
		return alpha === 1
			? `oklch(${from.l.toFixed(4)} ${from.c.toFixed(4)} ${from.h.toFixed(2)})`
			: `oklch(${from.l.toFixed(4)} ${from.c.toFixed(4)} ${from.h.toFixed(2)} / ${alpha})`;
	}

	// Default fallback
	return `rgba(0, 0, 0, 1)`;
}

