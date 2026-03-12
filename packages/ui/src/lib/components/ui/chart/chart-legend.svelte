<script lang="ts" module>
	export interface ChartLegendItem {
		label: string;
		color: string;
	}

	export interface ChartLegendProps {
		items: ChartLegendItem[];
		class?: string;
	}
</script>

<script lang="ts">
	import { cn } from '$lib/utils.js';

	let { items, class: className }: ChartLegendProps = $props();
</script>

<div class={cn('flex flex-wrap items-center gap-4 text-sm', className)}>
	{#each items as item}
		<div class="flex items-center gap-1.5">
			<span class="size-3 shrink-0 rounded-sm" style="background-color: {item.color};" />
			<span class="text-muted-foreground">{item.label}</span>
		</div>
	{/each}
</div>
