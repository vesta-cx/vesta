<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	const successSection = $derived(
		form && 'section' in form && typeof form.section === 'string' ? form.section : null
	);
	const isSegmentSaved = $derived(
		form && 'segmentDurationSaved' in form && form.segmentDurationSaved === true
	);

	const inputClass = 'bg-background border-input w-24 rounded-md border px-2 py-1.5 text-sm';

	const codecs = $derived([...new Set(data.enabledOptions.map((o) => o.codec))].sort());
	const bitrates = $derived(
		[...new Set(data.enabledOptions.map((o) => o.bitrate))].sort((a, b) => a - b)
	);

	const permTotal = $derived(
		data.permutationWeights ? Object.values(data.permutationWeights).reduce((a, b) => a + b, 0) : 0
	);
	const permPct = (key: string): string => {
		const w = data.permutationWeights?.[key] ?? 0;
		return permTotal > 0 ? ((w / permTotal) * 100).toFixed(1) : '0';
	};
</script>

<svelte:head>
	<title>Pairing Weights | Admin</title>
</svelte:head>

<div class="space-y-10">
	<div>
		<h1 class="text-2xl font-bold">Pairing Weights</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			Configure survey pairing, placebo rate, permutation weights, transition modes, game modes, and
			Tradeoff gap distribution.
		</p>
	</div>

	{#if form?.success}
		<div
			class="rounded-lg border bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-200"
		>
			{isSegmentSaved ? 'Segment duration saved.' : `Section "${successSection}" saved.`}
		</div>
	{/if}
	{#if form?.error}
		<div
			class="rounded-lg border bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200"
		>
			{form.error}
		</div>
	{/if}

	{#if data.pairingWeights}
		<!-- Section 1: Same vs different song -->
		<section class="rounded-xl border bg-card p-4">
			<h2 class="text-lg font-semibold">1. Same vs different song</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				Control how often the same song vs different songs are compared. Weights are relative.
			</p>
			<form
				method="POST"
				action="?/savePairing"
				use:enhance={() =>
					({ update }) =>
						update({ reset: false })}
				class="mt-4 flex flex-wrap items-end gap-4"
			>
				<div class="flex items-center gap-2">
					<label for="same_song" class="text-sm font-medium">Same song</label>
					<input
						id="same_song"
						name="same_song"
						type="number"
						min="0"
						step="0.1"
						value={data.pairingWeights.same_song}
						class={inputClass}
					/>
				</div>
				<div class="flex items-center gap-2">
					<label for="different_song" class="text-sm font-medium">Different songs</label>
					<input
						id="different_song"
						name="different_song"
						type="number"
						min="0"
						step="0.1"
						value={data.pairingWeights.different_song}
						class={inputClass}
					/>
				</div>
				<button
					type="submit"
					class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
				>
					Save
				</button>
			</form>
		</section>

		<!-- Section 2: Placebo probability -->
		<section class="rounded-xl border bg-card p-4">
			<h2 class="text-lg font-semibold">2. Placebo probability</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				Rounds where A and B are identical (attention check). 0–1 (e.g. 0.1 = 10%).
			</p>
			<form
				method="POST"
				action="?/savePlacebo"
				use:enhance={() =>
					({ update }) =>
						update({ reset: false })}
				class="mt-4 flex flex-wrap items-end gap-4"
			>
				<div class="flex items-center gap-2">
					<label for="placebo_probability" class="text-sm font-medium">Probability</label>
					<input
						id="placebo_probability"
						name="placebo_probability"
						type="number"
						min="0"
						max="1"
						step="0.01"
						value={data.placeboProbability ?? 0.1}
						class={inputClass}
					/>
				</div>
				<span class="text-sm text-muted-foreground">
					({((data.placeboProbability ?? 0.1) * 100).toFixed(0)}%)
				</span>
				<button
					type="submit"
					class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
				>
					Save
				</button>
			</form>
		</section>

		<!-- Section 3: Permutation weights table -->
		<section class="rounded-xl border bg-card p-4">
			<h2 class="text-lg font-semibold">3. Permutation weights</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				Weights for (codec, bitrate) combos. Higher = more likely to be picked. Unlisted combos get
				default 1.
			</p>
			{#if data.enabledOptions.length > 0}
				<form
					method="POST"
					action="?/savePermutation"
					use:enhance={() =>
						({ update }) =>
							update({ reset: false })}
					class="mt-4 overflow-x-auto"
				>
					<table class="min-w-[400px] text-sm">
						<thead>
							<tr class="border-b">
								<th class="p-2 text-left font-medium">Codec \ Bitrate</th>
								{#each bitrates as br}
									<th class="p-2 text-center font-medium">{br === 0 ? '0 (FLAC)' : br}</th>
								{/each}
								<th class="p-2 text-center text-muted-foreground">%</th>
							</tr>
						</thead>
						<tbody>
							{#each codecs as codec}
								<tr class="border-b">
									<td class="p-2 font-medium">{codec}</td>
									{#each bitrates as br}
										{@const key = `${codec}_${br}`}
										{@const exists = data.enabledOptions.some(
											(o) => o.codec === codec && o.bitrate === br
										)}
										<td class="p-2 text-center">
											{#if exists}
												<input
													type="number"
													name="perm_{key}"
													min="0"
													step="0.1"
													value={data.permutationWeights?.[key] ?? 1}
													class="w-16 rounded border border-input bg-background px-1 py-0.5 text-center text-sm"
												/>
											{:else}
												<span class="text-muted-foreground">—</span>
											{/if}
										</td>
									{/each}
									<td class="p-2 text-center text-muted-foreground">
										{permTotal > 0
											? (
													(data.enabledOptions
														.filter((o) => o.codec === codec)
														.reduce(
															(sum, o) =>
																sum + (data.permutationWeights?.[`${o.codec}_${o.bitrate}`] ?? 1),
															0
														) /
														permTotal) *
													100
												).toFixed(1)
											: '0'}%
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
					<button
						type="submit"
						class="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
					>
						Save permutation weights
					</button>
				</form>
			{:else}
				<p class="mt-4 text-sm text-muted-foreground">Enable quality options first.</p>
			{/if}
		</section>

		<!-- Section 4: Transition mode weights -->
		<section class="rounded-xl border bg-card p-4">
			<h2 class="text-lg font-semibold">4. Transition mode weights</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				Weights for gapless, gap_continue, gap_restart. gap_pause_resume applies only to
				different-song rounds.
			</p>
			<form
				method="POST"
				action="?/saveTransition"
				use:enhance={() =>
					({ update }) =>
						update({ reset: false })}
				class="mt-4 grid max-w-md gap-3 sm:grid-cols-2"
			>
				{#each ['gapless', 'gap_continue', 'gap_restart', 'gap_pause_resume'] as m}
					<div class="flex items-center justify-between gap-4">
						<label for={'trans_' + m} class="text-sm font-medium">{m}</label>
						<input
							id={'trans_' + m}
							name={m}
							type="number"
							min="0"
							step="0.1"
							value={data.transitionWeights?.[m] ?? 1}
							class={inputClass}
						/>
					</div>
				{/each}
				<button
					type="submit"
					class="w-fit rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:col-span-2"
				>
					Save transition weights
				</button>
			</form>
		</section>

		<!-- Section 5: Mode weights (Mixtape) -->
		<section class="rounded-xl border bg-card p-4">
			<h2 class="text-lg font-semibold">5. Mode weights (Mixtape)</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				Mixtape picks a mode each round by these weights. (Mode-specific generators coming in Phase
				6.)
			</p>
			<form
				method="POST"
				action="?/saveMode"
				use:enhance={() =>
					({ update }) =>
						update({ reset: false })}
				class="mt-4 grid max-w-md gap-3 sm:grid-cols-2"
			>
				{#each ['codec_compare', 'bitrate_battle', 'genre_trials', 'tradeoff'] as m}
					<div class="flex items-center justify-between gap-4">
						<label for={'mode_' + m} class="text-sm font-medium">{m.replace(/_/g, ' ')}</label>
						<input
							id={'mode_' + m}
							name={m}
							type="number"
							min="0"
							step="0.1"
							value={data.modeWeights?.[m] ?? 1}
							class={inputClass}
						/>
					</div>
				{/each}
				<button
					type="submit"
					class="w-fit rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:col-span-2"
				>
					Save mode weights
				</button>
			</form>
		</section>

		<!-- Section 6: Tradeoff gap config -->
		<section class="rounded-xl border bg-card p-4">
			<h2 class="text-lg font-semibold">6. Tradeoff gap config</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				Min/max target gap (log2) and control points for the probability density. Gaps between
				points are interpolated. Bias toward smaller or larger gaps by adjusting point weights.
			</p>
			{#if data.tradeoffGapConfig}
				<form
					method="POST"
					action="?/saveTradeoffGap"
					use:enhance={() =>
						({ update }) =>
							update({ reset: false })}
					class="mt-4 space-y-4"
				>
					<div class="flex flex-wrap gap-4">
						<div class="flex items-center gap-2">
							<label for="min_gap" class="text-sm font-medium">Min gap</label>
							<input
								id="min_gap"
								name="min_gap"
								type="number"
								min="0"
								step="0.1"
								value={data.tradeoffGapConfig.min_gap}
								class={inputClass}
							/>
						</div>
						<div class="flex items-center gap-2">
							<label for="max_gap" class="text-sm font-medium">Max gap</label>
							<input
								id="max_gap"
								name="max_gap"
								type="number"
								min="0"
								step="0.1"
								value={data.tradeoffGapConfig.max_gap}
								class={inputClass}
							/>
						</div>
					</div>
					<div>
						<label for="gap_points" class="text-sm font-medium">
							Control points (JSON: array of objects with gap and weight)
						</label>
						<textarea
							id="gap_points"
							name="gap_points"
							rows="4"
							class="mt-1 w-full max-w-xl rounded-md border border-input bg-background p-2 font-mono text-sm"
							>{JSON.stringify(data.tradeoffGapConfig.gap_points, null, 2)}</textarea
						>
					</div>
					<button
						type="submit"
						class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
					>
						Save Tradeoff gap config
					</button>
				</form>
			{/if}
		</section>

		<!-- Section 7: Segment duration -->
		<section class="rounded-xl border bg-card p-4">
			<h2 class="text-lg font-semibold">7. Segment duration</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				Length of each comparison segment in seconds. Applies to new rounds. Range: 1–120 s.
			</p>
			{#if data.segmentDurationMs != null}
				<form
					method="POST"
					action="?/saveSegmentDuration"
					use:enhance={() =>
						({ update }) =>
							update({ reset: false })}
					class="mt-4 flex flex-wrap items-end gap-4"
				>
					<div class="flex items-center gap-2">
						<label for="segment_duration_ms" class="text-sm font-medium">Duration (ms)</label>
						<input
							id="segment_duration_ms"
							name="segment_duration_ms"
							type="number"
							min="1000"
							max="120000"
							step="1000"
							value={data.segmentDurationMs}
							class={inputClass}
						/>
					</div>
					<span class="text-sm text-muted-foreground">
						({(data.segmentDurationMs / 1000).toFixed(1)} s)
					</span>
					<button
						type="submit"
						class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
					>
						Save duration
					</button>
				</form>
			{/if}
		</section>
	{:else}
		<p class="py-8 text-sm text-muted-foreground">
			No database connection (e.g. running outside Workers).
		</p>
	{/if}
</div>
