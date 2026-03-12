<script lang="ts">
	/**
	 * Heatmap for codec pair matchup matrix (e.g. opus vs mp3 by bitrate).
	 * Transforms codec_matchup_matrix into row/col/value for display.
	 */
	let {
		matrix,
		class: className = ''
	}: {
		matrix: Record<string, Record<string, { a_wins: number; b_wins: number; neither: number }>>;
		class?: string;
	} = $props();

	const heatmapData = $derived.by(() => {
		const out: Array<{ row: string; col: string; value: number }> = [];
		for (const [pairKey, brMap] of Object.entries(matrix)) {
			for (const [brKey, cell] of Object.entries(brMap)) {
				const total = cell.a_wins + cell.b_wins + cell.neither;
				if (total < 5) continue;
				const winRate = cell.a_wins / (cell.a_wins + cell.b_wins || 1);
				const [brA, brB] = brKey.split('_');
				const [codecA, , codecB] = pairKey.split('_');
				out.push({
					row: `${codecA}@${brA === '0' ? 'lossless' : brA}`,
					col: `${codecB}@${brB === '0' ? 'lossless' : brB}`,
					value: winRate
				});
			}
		}
		return out;
	});

	const rows = $derived([...new Set(heatmapData.map((d) => d.row))].sort());
	const cols = $derived([...new Set(heatmapData.map((d) => d.col))].sort());
</script>

{#if heatmapData.length > 0}
	<div class={className}>
		<h3 class="text-sm font-medium text-muted-foreground">Codec × Bitrate Matchup Win Rates</h3>
		<p class="mt-0.5 text-xs text-muted-foreground">
			Green = first codec wins; Red = second wins; 50% = equivalent.
		</p>
		{#await import('@vesta-cx/ui/components/ui/heatmap') then { Heatmap }}
			<div class="mt-4">
				<Heatmap data={heatmapData} {rows} {cols} rowLabel="Codec A" colLabel="Codec B" />
			</div>
		{/await}
	</div>
{/if}
