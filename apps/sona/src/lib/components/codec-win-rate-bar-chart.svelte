<script lang="ts">
	/**
	 * Bar chart for codec win rates with sample size.
	 * Accepts either scalar columns (winRate + comparisons) or insights codecWinRates.
	 */
	let {
		flacWinRate = null,
		flacComparisons = null,
		opusWinRate = null,
		opusComparisons = null,
		aacWinRate = null,
		aacComparisons = null,
		mp3WinRate = null,
		mp3Comparisons = null,
		codecWinRates = {},
		class: className = ''
	}: {
		flacWinRate?: number | null;
		flacComparisons?: number | null;
		opusWinRate?: number | null;
		opusComparisons?: number | null;
		aacWinRate?: number | null;
		aacComparisons?: number | null;
		mp3WinRate?: number | null;
		mp3Comparisons?: number | null;
		codecWinRates?: Record<string, number>;
		class?: string;
	} = $props();

	const entries = $derived.by(() => {
		const scalars: Array<{ codec: string; rate: number; comparisons: number | null }> = [];
		if (flacWinRate != null)
			scalars.push({ codec: 'flac', rate: flacWinRate, comparisons: flacComparisons ?? null });
		if (opusWinRate != null)
			scalars.push({ codec: 'opus', rate: opusWinRate, comparisons: opusComparisons ?? null });
		if (aacWinRate != null)
			scalars.push({ codec: 'aac', rate: aacWinRate, comparisons: aacComparisons ?? null });
		if (mp3WinRate != null)
			scalars.push({ codec: 'mp3', rate: mp3WinRate, comparisons: mp3Comparisons ?? null });
		if (scalars.length > 0) return scalars;
		return Object.entries(codecWinRates)
			.sort(([, a], [, b]) => b - a)
			.map(([codec, rate]) => ({ codec, rate, comparisons: null }));
	});
</script>

{#if entries.length > 0}
	<div class={className}>
		<h3 class="text-sm font-medium text-muted-foreground">Codec Win Rates</h3>
		<div class="mt-3 space-y-3">
			{#each entries as { codec, rate, comparisons }}
				<div class="flex items-center gap-3">
					<span class="w-14 text-sm font-medium capitalize">{codec}</span>
					<div class="h-4 flex-1 overflow-hidden rounded-full bg-muted">
						<div
							class="h-full rounded-full bg-primary transition-all"
							style="width: {Math.min(100, Math.round(rate * 100))}%"
						></div>
					</div>
					<span class="w-16 text-right text-sm text-muted-foreground">
						{Math.round(rate * 100)}%
						{#if comparisons != null}
							<span class="text-muted-foreground/70">({comparisons})</span>
						{/if}
					</span>
				</div>
			{/each}
		</div>
	</div>
{/if}
