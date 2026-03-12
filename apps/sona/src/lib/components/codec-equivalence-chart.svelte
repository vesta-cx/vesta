<script lang="ts">
	/**
	 * Codec equivalence ratios: at what ratio does codec A match codec B?
	 * e.g. opus_vs_mp3: 1.42 means opus@100 ≈ mp3@142
	 */
	let {
		ratios,
		class: className = ''
	}: {
		ratios: Record<string, number>;
		class?: string;
	} = $props();

	const entries = $derived(
		Object.entries(ratios)
			.filter(([, v]) => v > 0)
			.sort(([, a], [, b]) => b - a)
	);
</script>

{#if entries.length > 0}
	<div class={className}>
		<h3 class="text-sm font-medium text-muted-foreground">Codec Efficiency Ratios</h3>
		<p class="mt-0.5 text-xs text-muted-foreground">
			At equal perceptual quality, how much more efficient is codec A vs B? (e.g. 1.4 = A needs ~40%
			less bitrate)
		</p>
		<div class="mt-3 space-y-2">
			{#each entries as [pair, ratio]}
				<div class="flex items-center justify-between text-sm">
					<span class="font-medium">{pair.replace('_vs_', ' vs ')}</span>
					<span class="text-muted-foreground">{ratio.toFixed(2)}×</span>
				</div>
			{/each}
		</div>
	</div>
{/if}
