<script lang="ts">
	/**
	 * "Does bitrate matter?" chart — win rates by bitrate tier.
	 */
	let {
		lossless = null,
		high = null,
		mid = null,
		low = null,
		class: className = ''
	}: {
		lossless?: number | null;
		high?: number | null;
		mid?: number | null;
		low?: number | null;
		class?: string;
	} = $props();

	const tiers = $derived.by(() => {
		const t: Array<{ label: string; rate: number }> = [];
		if (lossless != null) t.push({ label: 'Lossless', rate: lossless });
		if (high != null) t.push({ label: 'High (256+)', rate: high });
		if (mid != null) t.push({ label: 'Mid (128–192)', rate: mid });
		if (low != null) t.push({ label: 'Low (under 128)', rate: low });
		return t;
	});
</script>

{#if tiers.length > 0}
	<div class={className}>
		<h3 class="text-sm font-medium text-muted-foreground">Win Rate by Bitrate Tier</h3>
		<p class="mt-0.5 text-xs text-muted-foreground">
			Higher bitrate tiers winning more suggests listeners can hear the difference.
		</p>
		<div class="mt-3 space-y-3">
			{#each tiers as { label, rate }}
				<div class="flex items-center gap-3">
					<span class="w-24 text-sm">{label}</span>
					<div class="h-4 flex-1 overflow-hidden rounded-full bg-muted">
						<div
							class="h-full rounded-full bg-primary transition-all"
							style="width: {Math.min(100, Math.round(rate * 100))}%"
						></div>
					</div>
					<span class="w-12 text-right text-sm text-muted-foreground">
						{Math.round(rate * 100)}%
					</span>
				</div>
			{/each}
		</div>
	</div>
{/if}
