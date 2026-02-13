<script lang="ts" module>
	export interface HeatmapCell {
		row: string;
		col: string;
		value: number;
		label?: string;
	}

	export interface HeatmapProps {
		data: HeatmapCell[];
		rows: string[];
		cols: string[];
		rowLabel?: string;
		colLabel?: string;
		minColor?: string;
		maxColor?: string;
		class?: string;
	}
</script>

<script lang="ts">
	import { cn } from '$lib/utils.js';

	let {
		data,
		rows,
		cols,
		rowLabel = '',
		colLabel = '',
		minColor = 'oklch(0.95 0.01 250)',
		maxColor = 'oklch(0.55 0.2 250)',
		class: className
	}: HeatmapProps = $props();

	let hoveredCell: HeatmapCell | null = $state(null);
	let tooltipX = $state(0);
	let tooltipY = $state(0);

	const maxValue = $derived(Math.max(...data.map((d) => d.value), 1));

	const getCellValue = (row: string, col: string): HeatmapCell | undefined =>
		data.find((d) => d.row === row && d.col === col);

	const getCellColor = (value: number): string => {
		const t = value / maxValue;
		// Interpolate in OKLCH space (approximate via opacity for simplicity)
		return `color-mix(in oklch, ${maxColor} ${Math.round(t * 100)}%, ${minColor})`;
	};

	const handleCellHover = (cell: HeatmapCell | undefined, event: MouseEvent) => {
		if (cell) {
			hoveredCell = cell;
			const rect = (event.target as HTMLElement).getBoundingClientRect();
			const parentRect = (event.target as HTMLElement)
				.closest('[data-heatmap]')
				?.getBoundingClientRect();
			if (parentRect) {
				tooltipX = rect.left - parentRect.left + rect.width / 2;
				tooltipY = rect.top - parentRect.top;
			}
		}
	};
</script>

<div class={cn('relative', className)} data-heatmap>
	<!-- Tooltip -->
	{#if hoveredCell}
		<div
			class="bg-popover text-popover-foreground pointer-events-none absolute z-50 rounded-md border px-3 py-1.5 text-xs shadow-md"
			style="left: {tooltipX}px; top: {tooltipY}px; transform: translate(-50%, -100%) translateY(-8px);"
		>
			<span class="font-medium">{hoveredCell.row} × {hoveredCell.col}</span>
			<span class="text-muted-foreground ml-2">{hoveredCell.label ?? `${(hoveredCell.value * 100).toFixed(1)}%`}</span>
		</div>
	{/if}

	<div class="overflow-x-auto">
		<table class="w-full border-collapse">
			{#if colLabel}
				<caption class="text-muted-foreground mb-2 text-xs">{colLabel}</caption>
			{/if}
			<thead>
				<tr>
					<th class="text-muted-foreground p-1 text-xs font-normal">
						{rowLabel}
					</th>
					{#each cols as col}
						<th class="text-muted-foreground p-1 text-center text-xs font-normal">{col}</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each rows as row}
					<tr>
						<td class="text-muted-foreground p-1 text-right text-xs">{row}</td>
						{#each cols as col}
							{@const cell = getCellValue(row, col)}
							<td class="p-0.5">
								<div
									class="flex size-full min-h-8 min-w-10 items-center justify-center rounded-sm transition-opacity hover:opacity-80"
									style="background-color: {cell ? getCellColor(cell.value) : 'transparent'};"
									role="gridcell"
									aria-label="{row} {col}: {cell ? `${(cell.value * 100).toFixed(1)}%` : 'no data'}"
									onmouseenter={(e) => handleCellHover(cell, e)}
									onmouseleave={() => (hoveredCell = null)}
								>
									{#if cell}
										<span class="text-[10px] font-medium opacity-70">
											{(cell.value * 100).toFixed(0)}
										</span>
									{/if}
								</div>
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
