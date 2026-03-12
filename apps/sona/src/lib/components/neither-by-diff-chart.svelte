<script lang="ts">
	/**
	 * Stacked bar or simple bar chart: "Neither" rate by bitrate difference bucket.
	 * X: bitrate diff (0-32, 32-64, 64-128, 128+), Y: neither rate.
	 */
	const BUCKET_ORDER = ['0-32', '32-64', '64-128', '128+'];

	let {
		data,
		class: className = ''
	}: {
		data: Record<string, number>;
		class?: string;
	} = $props();

	const bars = $derived(
		BUCKET_ORDER.filter((b) => data[b] !== undefined).map((bucket) => ({
			bucket,
			value: data[bucket] ?? 0
		}))
	);

	const maxVal = $derived(Math.max(...bars.map((b) => b.value), 0.01));
</script>

<div class={className}>
	<h3 class="text-sm font-medium text-muted-foreground">Uncertainty vs Bitrate Difference</h3>
	<p class="mt-0.5 text-xs text-muted-foreground">
		Closer bitrates → more "neither" (harder to tell apart).
	</p>
	<div class="mt-4 flex items-end gap-2" style="min-height: 8rem;">
		{#each bars as { bucket, value } (bucket)}
			<div class="flex flex-1 flex-col items-center gap-1">
				<div
					class="w-full max-w-16 min-w-0 rounded-t bg-primary/80 transition-all"
					style="height: {Math.max(4, (value / maxVal) * 96)}px"
					role="img"
					aria-label="{bucket} kbps diff: {(value * 100).toFixed(0)}% neither"
				></div>
				<span class="text-[10px] text-muted-foreground">{bucket}</span>
				<span class="text-[10px] text-muted-foreground">{(value * 100).toFixed(0)}%</span>
			</div>
		{/each}
	</div>
</div>
