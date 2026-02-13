<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface ChartTooltipProps {
		x?: number;
		y?: number;
		visible?: boolean;
		children: Snippet;
		class?: string;
	}
</script>

<script lang="ts">
	import { cn } from '$lib/utils.js';

	let { x = 0, y = 0, visible = false, children, class: className }: ChartTooltipProps = $props();
</script>

{#if visible}
	<div
		class={cn(
			'bg-popover text-popover-foreground pointer-events-none absolute z-50 rounded-md border px-3 py-1.5 text-xs shadow-md',
			className
		)}
		style="left: {x}px; top: {y}px; transform: translate(-50%, -100%) translateY(-8px);"
	>
		{@render children()}
	</div>
{/if}
