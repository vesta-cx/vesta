<script lang="ts">
	/**
	 * Perceptual Quality (PQ) line chart from Bradley-Terry scores.
	 * Uses LayerChart LineChart. X-axis: bitrate (kbps), Y-axis: normalized PQ (0–100%).
	 * One line per codec; shows diminishing returns and cross-codec equivalence.
	 */
	import { browser } from '$app/environment';
	import { LineChart } from 'layerchart';
	import { ChartRoot } from '@vesta-cx/ui/components/ui/chart';

	interface ChartRow {
		bitrate: number;
		[key: string]: number;
	}

	let {
		scores,
		codecColors = {},
		class: className = ''
	}: {
		scores: Record<string, number>;
		codecColors?: Record<string, string>;
		class?: string;
	} = $props();

	const DEFAULT_COLORS: Record<string, string> = {
		flac: 'oklch(0.55 0.2 250)',
		opus: 'oklch(0.55 0.18 150)',
		aac: 'oklch(0.55 0.2 30)',
		mp3: 'oklch(0.55 0.2 0)'
	};

	const LOSSY_CODECS = ['opus', 'aac', 'mp3'];

	const { data, series, hasFlacReference, flacColor } = $derived.by(() => {
		const pointsByCodec: Record<string, Array<{ bitrate: number; pq: number }>> = {};
		const allScores = Object.values(scores);
		const maxScore = Math.max(...allScores, 1);

		for (const [key, score] of Object.entries(scores)) {
			const [codec, bitrateStr] = key.split('_');
			const bitrate = parseInt(bitrateStr ?? '0', 10);
			if (Number.isNaN(bitrate)) continue;

			const pq = maxScore > 0 ? (score / maxScore) * 100 : 0;
			pointsByCodec[codec] = pointsByCodec[codec] ?? [];
			pointsByCodec[codec].push({ bitrate, pq });
		}

		for (const arr of Object.values(pointsByCodec)) {
			arr.sort((a, b) => a.bitrate - b.bitrate);
		}

		const hasFlac = (pointsByCodec['flac']?.length ?? 0) > 0;
		const flacCol = codecColors['flac'] ?? DEFAULT_COLORS['flac'] ?? 'currentColor';

		const codecs = Object.keys(pointsByCodec).filter(
			(c) => (pointsByCodec[c]?.length ?? 0) > 0 && LOSSY_CODECS.includes(c)
		);
		if (codecs.length === 0 && !hasFlac) {
			return {
				data: [] as ChartRow[],
				series: [],
				hasFlacReference: false,
				flacColor: flacCol
			};
		}

		const bitrateSet = new Set<number>();
		for (const pts of Object.values(pointsByCodec)) {
			for (const p of pts ?? []) {
				bitrateSet.add(p.bitrate);
			}
		}
		if (hasFlac) {
			bitrateSet.add(0);
			bitrateSet.add(320);
		}
		const bitrates = [...bitrateSet].sort((a, b) => a - b);

		const chartData: ChartRow[] = bitrates.map((bitrate) => {
			const row: ChartRow = { bitrate };
			for (const codec of codecs) {
				const pt = pointsByCodec[codec]?.find((p) => p.bitrate === bitrate);
				row[codec] = pt?.pq ?? 0;
			}
			if (hasFlac) {
				row['flac'] = 100;
			}
			return row;
		});

		const chartSeries = [
			...codecs.map((codec) => ({
				key: codec,
				label: codec.charAt(0).toUpperCase() + codec.slice(1),
				value: (d: ChartRow) => d[codec] as number,
				color: codecColors[codec] ?? DEFAULT_COLORS[codec] ?? 'currentColor'
			})),
			...(hasFlac
				? [
						{
							key: 'flac',
							label: 'FLAC',
							value: (d: ChartRow) => d['flac'] as number,
							color: flacCol,
							props: {
								fill: 'none',
								stroke: flacCol,
								strokeWidth: 1,
								strokeOpacity: 0.8,
								'stroke-dasharray': '6 4'
							}
						}
					]
				: [])
		];

		return {
			data: chartData,
			series: chartSeries,
			hasFlacReference: hasFlac,
			flacColor: flacCol
		};
	});

	const xDomain = $derived.by(() => {
		if (data.length === 0) return [0, 320];
		const bitrates = data.map((d) => d.bitrate);
		return [Math.min(0, ...bitrates), Math.max(320, ...bitrates)];
	});
</script>

<div class={className}>
	<h3 class="text-sm font-medium text-muted-foreground">Perceptual Quality by Bitrate</h3>
	<p class="mt-0.5 text-xs text-muted-foreground">
		Bradley-Terry scores (normalized). Higher = more preferred. Where curves flatten ≈ diminishing
		returns.
	</p>
	{#if data.length > 0 && (series.length > 0 || hasFlacReference)}
		{#if browser}
			<ChartRoot class="mt-4 min-h-60 w-full overflow-visible" aspectRatio="2/1">
				<LineChart
					{data}
					x="bitrate"
					{series}
					yDomain={[0, 100]}
					{xDomain}
					padding={{ top: 16, right: 24, bottom: 32, left: 24 }}
					tooltip={true}
					grid={true}
					legend={false}
					points={false}
					props={{
						spline: {
							fill: 'none',
							strokeWidth: 1.5
						},
						tooltip: {
							hideTotal: true,
							root: {
								variant: 'none',
								classes: {
									container:
										'bg-card border border-border rounded-lg shadow-sm text-card-foreground py-2 px-3 text-sm'
								}
							},
							list: {
								class: 'grid-cols-1 gap-y-0.5'
							},
							header: {
								classes: { root: 'mb-0.5 pb-0.5' }
							},
							item: {
								classes: {
									root: '!flex flex-row items-center justify-between gap-x-4',
									label: 'flex items-center gap-2 shrink-0',
									value: 'text-right tabular-nums shrink-0'
								}
							}
						},
						xAxis: {
							fontSize: 10,
							tickLabelProps: { fill: 'var(--color-muted-foreground)' }
						},
						yAxis: {
							fontSize: 10,
							tickLabelProps: { fill: 'var(--color-muted-foreground)' }
						}
					}}
				/>
			</ChartRoot>
		{:else}
			<div
				class="mt-4 flex h-60 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground"
			>
				Loading chart…
			</div>
		{/if}

		<!-- Legend -->
		<div class="mt-2 flex flex-wrap gap-3 text-[11px]">
			{#each series as s (s.key)}
				<div class="flex items-center gap-1.5">
					{#if s.key === 'flac'}
						<span class="inline-block w-4 border-b-2 border-dashed" style="border-color: {s.color}"
						></span>
					{:else}
						<span class="inline-block size-2.5 rounded-full" style="background-color: {s.color}"
						></span>
					{/if}
					<span>{s.label}</span>
				</div>
			{/each}
		</div>
	{:else}
		<p class="mt-4 text-xs text-muted-foreground">No comparison data yet.</p>
	{/if}
</div>
