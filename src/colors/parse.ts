import type { ParsedColor } from './types';

/**
 * Parse a CSS color string into a ParsedColor object
 * Supports: rgb/rgba, hsl/hsla, oklab, oklch, and hex formats
 *
 * @param color - CSS color string (e.g., "rgba(255, 0, 0, 1)", "oklch(0.5 0.2 180)")
 * @returns ParsedColor object representing the color in its native color space
 */
export function parseColor(color: string): ParsedColor {
	// Handle rgba/rgb format
	const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i);
	if (rgbaMatch && rgbaMatch[1] && rgbaMatch[2] && rgbaMatch[3]) {
		return {
			space: 'rgb',
			r: parseInt(rgbaMatch[1], 10),
			g: parseInt(rgbaMatch[2], 10),
			b: parseInt(rgbaMatch[3], 10),
			a: rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1,
		};
	}

	// Handle hsla/hsl format
	const hslaMatch = color.match(
		/hsla?\((\d+(?:\.\d+)?),\s*([\d.]+)%,\s*([\d.]+)%(?:,\s*([\d.]+))?\)/i,
	);
	if (hslaMatch && hslaMatch[1] && hslaMatch[2] && hslaMatch[3]) {
		return {
			space: 'hsl',
			h: parseFloat(hslaMatch[1]),
			s: parseFloat(hslaMatch[2]) / 100,
			l: parseFloat(hslaMatch[3]) / 100,
			a: hslaMatch[4] ? parseFloat(hslaMatch[4]) : 1,
		};
	}

	// Handle oklab format: oklab(l a b / alpha) or oklab(l a b)
	const oklabMatch = color.match(
		/oklab\(([\d.]+)\s+([\d.+-]+)\s+([\d.+-]+)(?:\s*\/\s*([\d.]+))?\)/i,
	);
	if (oklabMatch && oklabMatch[1] && oklabMatch[2] && oklabMatch[3]) {
		return {
			space: 'oklab',
			l: parseFloat(oklabMatch[1]),
			a: parseFloat(oklabMatch[2]),
			b: parseFloat(oklabMatch[3]),
			alpha: oklabMatch[4] ? parseFloat(oklabMatch[4]) : 1,
		};
	}

	// Handle oklch format: oklch(l c h / alpha) or oklch(l c h)
	const oklchMatch = color.match(
		/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/i,
	);
	if (oklchMatch && oklchMatch[1] && oklchMatch[2] && oklchMatch[3]) {
		return {
			space: 'oklch',
			l: parseFloat(oklchMatch[1]),
			c: parseFloat(oklchMatch[2]),
			h: parseFloat(oklchMatch[3]),
			alpha: oklchMatch[4] ? parseFloat(oklchMatch[4]) : 1,
		};
	}

	// Handle 6-digit hex format (#rrggbb or #rrggbbaa)
	const hex6Match = color.match(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})?/i);
	if (hex6Match && hex6Match[1] && hex6Match[2] && hex6Match[3]) {
		return {
			space: 'rgb',
			r: parseInt(hex6Match[1], 16),
			g: parseInt(hex6Match[2], 16),
			b: parseInt(hex6Match[3], 16),
			a: hex6Match[4] ? parseInt(hex6Match[4], 16) / 255 : 1,
		};
	}

	// Handle 3-digit hex format (#rgb)
	const hex3Match = color.match(/#([0-9a-f])([0-9a-f])([0-9a-f])/i);
	if (hex3Match && hex3Match[1] && hex3Match[2] && hex3Match[3]) {
		return {
			space: 'rgb',
			r: parseInt(hex3Match[1] + hex3Match[1], 16),
			g: parseInt(hex3Match[2] + hex3Match[2], 16),
			b: parseInt(hex3Match[3] + hex3Match[3], 16),
			a: 1,
		};
	}

	// Default fallback to black in RGB
	return { space: 'rgb', r: 0, g: 0, b: 0, a: 1 };
}

