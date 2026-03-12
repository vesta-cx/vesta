<script lang="ts">
	/**
	 * Heatmap: Codec×Bitrate × Genre. Cell = PQ % for that config in that genre.
	 */
	let {
		scoresByGenre,
		class: className = ''
	}: {
		scoresByGenre: Record<string, Record<string, number>>;
		class?: string;
	} = $props();

	const rows = $derived.by(() => {
		const seen = new Set<string>();
		for (const key of Object.keys(scoresByGenre)) {
			seen.add(key);
		}
		return [...seen].sort();
	});

	const cols = $derived.by(() => {
		const seen = new Set<string>();
		for (const genreMap of Object.values(scoresByGenre)) {
			for (const g of Object.keys(genreMap)) {
				seen.add(g);
			}
		}
		return [...seen].sort();
	});

	// Heatmap expects value 0-1; PQ is 0-100. Pass value/100 and label for display.
	const data = $derived.by(() => {
		const out: Array<{ row: string; col: string; value: number; label?: string }> = [];
		for (const row of rows) {
			const genreMap = scoresByGenre[row];
			if (!genreMap) continue;
			for (const col of cols) {
				const v = genreMap[col];
				if (v != null)
					out.push({
						row,
						col,
						value: v / 100,
						label: `${v.toFixed(1)}%`
					});
			}
		}
		return out;
	});
</script>

{#if data.length > 0}
	<div class={className}>
		<h3 class="text-sm font-medium text-muted-foreground">PQ by Codec×Bitrate and Genre</h3>
		<p class="mt-0.5 text-xs text-muted-foreground">Cell = PQ % for that config in that genre.</p>
		{#await import('@vesta-cx/ui/components/ui/heatmap') then { Heatmap }}
			<div class="mt-4">
				<Heatmap {data} {rows} {cols} rowLabel="Config" colLabel="Genre" />
			</div>
		{/await}
	</div>
{/if}
