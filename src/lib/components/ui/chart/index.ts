import ChartRoot from './chart-root.svelte';
import ChartTooltip from './chart-tooltip.svelte';
import ChartLegend from './chart-legend.svelte';

export type { ChartRootProps } from './chart-root.svelte';
export type { ChartTooltipProps } from './chart-tooltip.svelte';
export type { ChartLegendProps, ChartLegendItem } from './chart-legend.svelte';

export { ChartRoot, ChartTooltip, ChartLegend };

/** CSS custom property names for chart theme colors */
export const CHART_COLORS = [
	'var(--color-chart-1)',
	'var(--color-chart-2)',
	'var(--color-chart-3)',
	'var(--color-chart-4)',
	'var(--color-chart-5)'
] as const;
