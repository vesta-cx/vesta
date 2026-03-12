<script lang="ts">
	/**
	 * Gap analysis: same_gapless, same_gap, different_gapless, different_gap.
	 */
	let {
		sameGapless = 0,
		sameGap = 0,
		differentGapless = 0,
		differentGap = 0,
		class: className = ''
	}: {
		sameGapless?: number;
		sameGap?: number;
		differentGapless?: number;
		differentGap?: number;
		class?: string;
	} = $props();

	const segments = $derived.by(() => {
		const total = sameGapless + sameGap + differentGapless + differentGap;
		if (total === 0) return [];
		return [
			{ label: 'Same song, gapless', count: sameGapless, pct: sameGapless / total },
			{ label: 'Same song, with gap', count: sameGap, pct: sameGap / total },
			{ label: 'Different song, gapless', count: differentGapless, pct: differentGapless / total },
			{ label: 'Different song, with gap', count: differentGap, pct: differentGap / total }
		].filter((s) => s.count > 0);
	});
</script>

{#if segments.length > 0}
	<div class={className}>
		<h3 class="text-sm font-medium text-muted-foreground">Comparison Type Distribution</h3>
		<p class="mt-0.5 text-xs text-muted-foreground">
			Breakdown by song pairing and transition mode.
		</p>
		<div class="mt-3 space-y-2">
			{#each segments as { label, count, pct } (label)}
				<div class="flex items-center gap-3">
					<span class="w-44 truncate text-sm">{label}</span>
					<div class="h-3 flex-1 overflow-hidden rounded-full bg-muted">
						<div
							class="h-full rounded-full bg-primary transition-all"
							style="width: {Math.min(100, Math.round(pct * 100))}%"
						></div>
					</div>
					<span class="w-16 text-right text-xs text-muted-foreground">
						{count} ({Math.round(pct * 100)}%)
					</span>
				</div>
			{/each}
		</div>
	</div>
{/if}
