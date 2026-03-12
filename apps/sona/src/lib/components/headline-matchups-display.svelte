<script lang="ts">
	/**
	 * Headline matchup stats: lossless vs lossy, opus vs mp3, aac vs mp3.
	 */
	let {
		losslessWins = null,
		losslessTotal = null,
		opusWins = null,
		opusTotal = null,
		aacWins = null,
		aacTotal = null,
		class: className = ''
	}: {
		losslessWins?: number | null;
		losslessTotal?: number | null;
		opusWins?: number | null;
		opusTotal?: number | null;
		aacWins?: number | null;
		aacTotal?: number | null;
		class?: string;
	} = $props();

	const matchups = $derived.by(() => {
		const m: Array<{ label: string; wins: number; total: number }> = [];
		if (losslessTotal != null && losslessTotal > 0 && losslessWins != null) {
			m.push({ label: 'Lossless vs lossy', wins: losslessWins, total: losslessTotal });
		}
		if (opusTotal != null && opusTotal > 0 && opusWins != null) {
			m.push({ label: 'Opus vs MP3 (same bitrate)', wins: opusWins, total: opusTotal });
		}
		if (aacTotal != null && aacTotal > 0 && aacWins != null) {
			m.push({ label: 'AAC vs MP3 (same bitrate)', wins: aacWins, total: aacTotal });
		}
		return m;
	});
</script>

{#if matchups.length > 0}
	<div class={className}>
		<h3 class="text-sm font-medium text-muted-foreground">Headline Matchups</h3>
		<div class="mt-3 space-y-3">
			{#each matchups as { label, wins, total }}
				<div class="flex items-center justify-between text-sm">
					<span>{label}</span>
					<span>
						<span class="font-medium">{wins}</span>
						<span class="text-muted-foreground"> / {total}</span>
						<span class="ml-1 text-muted-foreground">
							({total > 0 ? Math.round((wins / total) * 100) : 0}%)
						</span>
					</span>
				</div>
			{/each}
		</div>
	</div>
{/if}
