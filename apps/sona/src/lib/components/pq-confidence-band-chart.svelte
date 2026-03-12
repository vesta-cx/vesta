<script lang="ts">
	/**
	 * PQ line with confidence band showing genre variance.
	 * Thick band = more genre-dependent; thin band = consistent.
	 */
	interface DataPoint {
		bitrate: number;
		pq: number;
		minPq?: number;
		maxPq?: number;
	}

	let {
		scoresByGenre,
		codecColors = {},
		class: className = ''
	}: {
		scoresByGenre: Record<string, Record<string, number>>;
		codecColors?: Record<string, string>;
		class?: string;
	} = $props();

	const DEFAULT_COLORS: Record<string, string> = {
		flac: 'oklch(0.55 0.2 250)',
		opus: 'oklch(0.55 0.18 150)',
		aac: 'oklch(0.55 0.2 30)',
		mp3: 'oklch(0.55 0.2 0)'
	};

	const series = $derived.by(() => {
		const pointsByCodec: Record<string, DataPoint[]> = {};
		for (const [key, genreMap] of Object.entries(scoresByGenre)) {
			const [codec, bitrateStr] = key.split('_');
			const bitrate = parseInt(bitrateStr ?? '0', 10);
			if (Number.isNaN(bitrate)) continue;

			const values = Object.values(genreMap);
			const pq = values.reduce((a, b) => a + b, 0) / (values.length || 1);
			const minPq = Math.min(...values);
			const maxPq = Math.max(...values);

			pointsByCodec[codec] = pointsByCodec[codec] ?? [];
			pointsByCodec[codec].push({
				bitrate,
				pq,
				minPq: values.length > 1 ? minPq : undefined,
				maxPq: values.length > 1 ? maxPq : undefined
			});
		}

		for (const arr of Object.values(pointsByCodec)) {
			arr.sort((a, b) => a.bitrate - b.bitrate);
		}

		return Object.entries(pointsByCodec)
			.filter(([, pts]) => pts.length > 0)
			.map(([codec, pts]) => ({ codec, points: pts }));
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
		const first = points[0];
		let d = `M ${xScale(first.bitrate)} ${yScale(first.pq)}`;
		for (let i = 1; i < points.length; i++) {
			d += ` L ${xScale(points[i].bitrate)} ${yScale(points[i].pq)}`;
		}
		return d;
	};

	const bandPath = (points: DataPoint[]) => {
		if (points.length === 0 || points.every((p) => p.minPq == null)) return '';
		let d = '';
		for (let i = 0; i < points.length; i++) {
			const p = points[i];
			const x = xScale(p.bitrate);
			const yMin = yScale(p.maxPq ?? p.pq);
			const yMax = yScale(p.minPq ?? p.pq);
			if (i === 0) d = `M ${x} ${yMin}`;
			else d += ` L ${x} ${yMin}`;
		}
		for (let i = points.length - 1; i >= 0; i--) {
			const p = points[i];
			d += ` L ${xScale(p.bitrate)} ${yScale(p.minPq ?? p.pq)}`;
		}
		return d + ' Z';
	};

	const xTicks = [0, 64, 128, 192, 256, 320].filter((t) => t >= xDomain[0] && t <= xDomain[1]);
	const yTicks = [0, 25, 50, 75, 100];
</script>

<div class={className}>
	<h3 class="text-sm font-medium text-muted-foreground">PQ by Genre (Confidence Band)</h3>
	<p class="mt-0.5 text-xs text-muted-foreground">
		Band width = genre variance. Thin = consistent; thick = genre-sensitive.
	</p>
	<svg
		viewBox="0 0 {width} {height}"
		class="mt-4 w-full max-w-full"
		aria-label="Perceptual quality with genre confidence bands"
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
		{#each xTicks.slice(1, -1) as tick (tick)}
			<line
				x1={xScale(tick)}
				y1={padding.top}
				x2={xScale(tick)}
				y2={height - padding.bottom}
				class="stroke-border"
				stroke-width="0.5"
				stroke-dasharray="4"
			/>
		{/each}

		{#each series as { codec, points } (codec)}
			{@const color = codecColors[codec] ?? DEFAULT_COLORS[codec] ?? 'currentColor'}
			{#if points.some((p) => p.minPq != null)}
				<path d={bandPath(points)} fill={color} fill-opacity="0.2" stroke="none" />
			{/if}
			<path
				d={pathForSeries(points)}
				fill="none"
				stroke={color}
				stroke-width="2"
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

	<div class="mt-2 flex flex-wrap gap-3 text-xs">
		{#each series as { codec } (codec)}
			{@const color = codecColors[codec] ?? DEFAULT_COLORS[codec] ?? 'currentColor'}
			<div class="flex items-center gap-1.5">
				<span class="inline-block size-2.5 rounded-full" style="background-color: {color}"></span>
				<span class="capitalize">{codec}</span>
			</div>
		{/each}
	</div>
</div>
