<script lang="ts">
	/**
	 * Spaghetti plot: one PQ line per genre, same codec.
	 * Shows which genres are most "codec-demanding."
	 */
	interface DataPoint {
		bitrate: number;
		pq: number;
	}

	let {
		scoresByGenre,
		codec = 'opus',
		class: className = ''
	}: {
		scoresByGenre: Record<string, Record<string, number>>;
		codec?: string;
		class?: string;
	} = $props();

	const series = $derived.by(() => {
		const byGenre: Record<string, DataPoint[]> = {};
		for (const [key, genreMap] of Object.entries(scoresByGenre)) {
			const [c, bitrateStr] = key.split('_');
			if (c !== codec) continue;
			const bitrate = parseInt(bitrateStr ?? '0', 10);
			if (Number.isNaN(bitrate)) continue;

			for (const [genre, pq] of Object.entries(genreMap)) {
				byGenre[genre] = byGenre[genre] ?? [];
				byGenre[genre].push({ bitrate, pq });
			}
		}

		for (const arr of Object.values(byGenre)) {
			arr.sort((a, b) => a.bitrate - b.bitrate);
		}

		return Object.entries(byGenre)
			.filter(([, pts]) => pts.length > 0)
			.map(([genre, points]) => ({ genre, points }));
	});

	const width = 400;
	const height = 240;
	const padding = { top: 20, right: 20, bottom: 36, left: 44 };
	const STROKES = ['2', '1.5', '1', '0.5'];

	const xDomain = $derived.by(() => {
		const allBitrates = series.flatMap((s) => s.points.map((p) => p.bitrate));
		return [Math.min(0, ...allBitrates), Math.max(320, ...allBitrates)];
	});

	const xScale = (v: number) =>
		padding.left +
		((v - xDomain[0]) / (xDomain[1] - xDomain[0])) * (width - padding.left - padding.right);
	const yScale = (v: number) =>
		padding.top +
		height -
		padding.top -
		padding.bottom -
		(v / 100) * (height - padding.top - padding.bottom);

	const pathForSeries = (points: DataPoint[]) => {
		if (points.length === 0) return '';
		let d = `M ${xScale(points[0].bitrate)} ${yScale(points[0].pq)}`;
		for (let i = 1; i < points.length; i++) {
			d += ` L ${xScale(points[i].bitrate)} ${yScale(points[i].pq)}`;
		}
		return d;
	};

	const xTicks = [0, 64, 128, 192, 256, 320].filter((t) => t >= xDomain[0] && t <= xDomain[1]);
	const yTicks = [0, 25, 50, 75, 100];
</script>

{#if series.length > 0}
	<div class={className}>
		<h3 class="text-sm font-medium text-muted-foreground capitalize">
			{codec} by Genre (Spaghetti)
		</h3>
		<p class="mt-0.5 text-xs text-muted-foreground">
			One line per genre. Lower = more codec-demanding (easier to hear artifacts).
		</p>
		<svg
			viewBox="0 0 {width} {height}"
			class="mt-4 w-full max-w-full"
			aria-label="PQ spaghetti plot by genre for {codec}"
		>
			{#each yTicks.slice(1, -1) as tick (tick)}
				<line
					x1={padding.left}
					y1={yScale(tick)}
					x2={width - padding.right}
					y2={yScale(tick)}
					class="stroke-border"
					stroke-width="0.5"
					stroke-dasharray="4"
				/>
			{/each}
			{#each series as { genre, points }, i (genre)}
				<path
					d={pathForSeries(points)}
					fill="none"
					class="stroke-foreground"
					stroke-width={STROKES[i % STROKES.length]}
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			{/each}
			<line
				x1={padding.left}
				y1={height - padding.bottom}
				x2={width - padding.right}
				y2={height - padding.bottom}
				class="stroke-foreground"
				stroke-width="1"
			/>
			<line
				x1={padding.left}
				y1={padding.top}
				x2={padding.left}
				y2={height - padding.bottom}
				class="stroke-foreground"
				stroke-width="1"
			/>
			{#each xTicks as tick (tick)}
				<text
					x={xScale(tick)}
					y={height - 8}
					class="fill-muted-foreground text-[10px]"
					text-anchor="middle"
				>
					{tick === 0 ? 'FLAC' : tick}
				</text>
			{/each}
			{#each yTicks as tick (tick)}
				<text
					x={padding.left - 6}
					y={yScale(tick) + 3}
					class="fill-muted-foreground text-[10px]"
					text-anchor="end"
				>
					{tick}%
				</text>
			{/each}
		</svg>
		<div class="mt-2 flex flex-wrap gap-3 text-xs capitalize">
			{#each series as { genre } (genre)}
				<span>{genre}</span>
			{/each}
		</div>
	</div>
{/if}
