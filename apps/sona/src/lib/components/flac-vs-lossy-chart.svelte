<script lang="ts">
	/**
	 * FLAC win rate vs lossy codec at each bitrate.
	 * Shows at what bitrate each codec becomes "transparent" (50% = can't tell from FLAC).
	 */
	interface DataPoint {
		bitrate: number;
		flacWinRate: number;
	}

	let {
		data,
		class: className = ''
	}: {
		data: Record<string, Record<string, number>>;
		class?: string;
	} = $props();

	const CODEC_COLORS: Record<string, string> = {
		opus: 'oklch(0.55 0.18 150)',
		aac: 'oklch(0.55 0.2 30)',
		mp3: 'oklch(0.55 0.2 0)'
	};

	const series = $derived.by(() => {
		return Object.entries(data)
			.filter(([codec]) => codec !== 'flac')
			.map(([codec, bitrateMap]) => ({
				codec,
				points: Object.entries(bitrateMap)
					.map(([br, rate]) => ({ bitrate: parseInt(br, 10), flacWinRate: rate }))
					.filter((p) => !Number.isNaN(p.bitrate))
					.sort((a, b) => a.bitrate - b.bitrate)
			}))
			.filter((s) => s.points.length > 0);
	});

	const width = 400;
	const height = 240;
	const padding = { top: 20, right: 20, bottom: 36, left: 44 };

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
		let d = `M ${xScale(points[0].bitrate)} ${yScale(points[0].flacWinRate * 100)}`;
		for (let i = 1; i < points.length; i++) {
			d += ` L ${xScale(points[i].bitrate)} ${yScale(points[i].flacWinRate * 100)}`;
		}
		return d;
	};

	const xTicks = [0, 64, 128, 192, 256, 320].filter((t) => t >= xDomain[0] && t <= xDomain[1]);
</script>

<div class={className}>
	<h3 class="text-sm font-medium text-muted-foreground">FLAC vs Lossy — Transparency Threshold</h3>
	<p class="mt-0.5 text-xs text-muted-foreground">
		When FLAC win rate crosses 50%, listeners can't reliably tell lossy from lossless.
	</p>
	<svg
		viewBox="0 0 {width} {height}"
		class="mt-4 w-full max-w-full"
		aria-label="FLAC win rate against each lossy codec by bitrate"
	>
		<!-- 50% line -->
		<line
			x1={padding.left}
			y1={yScale(50)}
			x2={width - padding.right}
			y2={yScale(50)}
			class="stroke-muted-foreground"
			stroke-width="1.5"
			stroke-dasharray="6"
		/>
		<text
			x={width - padding.right - 4}
			y={yScale(50) - 4}
			class="fill-muted-foreground text-[9px]"
			text-anchor="end"
		>
			50% (transparent)
		</text>

		<!-- Grid -->
		{#each [25, 75] as tick}
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

		<!-- Lines -->
		{#each series as { codec, points } (codec)}
			<path
				d={pathForSeries(points)}
				fill="none"
				stroke={CODEC_COLORS[codec] ?? 'currentColor'}
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		{/each}

		<!-- Axes -->
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

		<!-- Labels -->
		{#each xTicks as tick}
			<text
				x={xScale(tick)}
				y={height - 8}
				class="fill-muted-foreground text-[10px]"
				text-anchor="middle"
			>
				{tick}
			</text>
		{/each}
		<text
			x={padding.left - 6}
			y={height / 2 + 4}
			class="fill-muted-foreground text-[10px]"
			text-anchor="middle"
			transform="rotate(-90, {padding.left - 6}, {height / 2})"
		>
			FLAC win %
		</text>
	</svg>

	<div class="mt-2 flex flex-wrap gap-3 text-xs">
		{#each series as { codec } (codec)}
			<div class="flex items-center gap-1.5">
				<span
					class="inline-block size-2.5 rounded-full"
					style="background-color: {CODEC_COLORS[codec] ?? 'currentColor'}"
				></span>
				<span class="capitalize">{codec}</span>
			</div>
		{/each}
	</div>
</div>
