<script lang="ts">
	import {
		Section,
		SectionBackground,
		SectionContent
	} from '@vesta-cx/ui/components/layout/section';
	import * as StatCard from '@vesta-cx/ui/components/ui/stat-card';
	import * as Empty from '@vesta-cx/ui/components/ui/empty';
	import HeroCanvas from '$lib/components/hero-canvas.svelte';
	import PqLineChart from '$lib/components/pq-line-chart.svelte';
	import FlacVsLossyChart from '$lib/components/flac-vs-lossy-chart.svelte';
	import NeitherByDiffChart from '$lib/components/neither-by-diff-chart.svelte';
	import CodecDescriptions from '$lib/components/codec-descriptions.svelte';
	import OverallStatsDisplay from '$lib/components/overall-stats-display.svelte';
	import CodecWinRateBarChart from '$lib/components/codec-win-rate-bar-chart.svelte';
	import BitrateTierChart from '$lib/components/bitrate-tier-chart.svelte';
	import DeviceDistributionChart from '$lib/components/device-distribution-chart.svelte';
	import HeadlineMatchupsDisplay from '$lib/components/headline-matchups-display.svelte';
	import CodecEquivalenceChart from '$lib/components/codec-equivalence-chart.svelte';
	import CodecMatchupHeatmap from '$lib/components/codec-matchup-heatmap.svelte';
	import ComparisonTypeDistributionChart from '$lib/components/comparison-type-distribution-chart.svelte';
	import PqConfidenceBandChart from '$lib/components/pq-confidence-band-chart.svelte';
	import PqSpaghettiChart from '$lib/components/pq-spaghetti-chart.svelte';
	import GenreHeatmapChart from '$lib/components/genre-heatmap-chart.svelte';
	import { pageTitle } from '$lib/constants/identity';

	let { data } = $props();

	const snapshot = $derived(data.snapshot);
	const contentLibrary = $derived(data.contentLibrary);
	const insights = $derived(snapshot?.insights as Record<string, unknown> | null);

	// Extract chart data from insights
	const codecWinRates = $derived(
		(insights?.codecWinRates as Record<string, number> | undefined) ?? {}
	);
	const btScores = $derived(
		(snapshot?.codecPqScores as Record<string, number> | undefined) ??
			(insights?.bradleyTerryScores as Record<string, number> | undefined) ??
			{}
	);
	const deviceBreakdown = $derived(
		(insights?.deviceBreakdown as Record<string, number> | undefined) ?? {}
	);
	const heatmapData = $derived(
		(insights?.heatmap as Array<{ row: string; col: string; value: number }> | undefined) ?? []
	);
	const neitherRate = $derived((insights?.neitherRate as number | undefined) ?? 0);
	const flacVsLossy = $derived(
		(snapshot?.flacVsLossyWinRates as Record<string, Record<string, number>> | undefined) ??
			(insights?.flacVsLossy as Record<string, Record<string, number>> | undefined) ??
			{}
	);
	const neitherByBitrateDiff = $derived(
		(insights?.neitherByBitrateDiff as Record<string, number> | undefined) ?? {}
	);

	const codecs = ['FLAC', 'Opus', 'MP3', 'AAC'];
	const codecDescriptions: Record<string, string> = {
		FLAC: 'Lossless compression — bit-perfect reproduction of the original audio',
		Opus: 'Modern lossy codec — excellent quality at low bitrates, open standard',
		MP3: 'Legacy lossy codec — universal compatibility, less efficient than modern codecs',
		AAC: 'Lossy codec — default for Apple devices, better than MP3 at equivalent bitrates'
	};
</script>

<svelte:head>
	<title>{pageTitle()}</title>
	<meta
		name="description"
		content="Put your ears to the test, and help us build better streaming. Blind A/B audio comparisons."
	/>
</svelte:head>

<!-- Hero Section -->
<Section
	data-section="hero"
	class="min-h-[max(calc(100svh-20rem),40rem)] items-center justify-center"
>
	<SectionBackground>
		<div class="absolute inset-0 bg-linear-to-br from-primary/5 via-background to-primary/5"></div>
		<HeroCanvas waves={4} particles={96} />
		<div class="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-background"></div>
	</SectionBackground>
	<SectionContent class="flex flex-col items-center text-center">
		<div class="mx-auto max-w-3xl">
			<h1 class="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
				Can you hear
				<span class="text-primary">the difference?</span>
			</h1>
			<p class="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
				Put your ears to the test, and help us build better streaming.
			</p>
			<div class="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
				<a
					href="/survey/setup"
					class="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
				>
					Play Now
				</a>
				<a
					href="#results"
					class="inline-flex items-center rounded-lg px-6 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
				>
					View Results ↓
				</a>
			</div>
		</div>
	</SectionContent>
</Section>

<!-- Stats Dashboard -->
<Section id="results">
	<SectionContent class="py-16">
		{#if snapshot}
			<div class="mb-12 text-center">
				<h2 class="text-3xl font-bold tracking-tight">Results So Far</h2>
				<p class="mt-2 text-muted-foreground">
					Based on {snapshot.totalResponses.toLocaleString()} blind comparisons
				</p>
				{#if contentLibrary && contentLibrary.songCount > 0}
					<p class="mt-1 text-sm text-muted-foreground">
						Content library: {contentLibrary.songCount}
						{contentLibrary.songCount === 1 ? 'song' : 'songs'} from {contentLibrary.artistCount}
						{contentLibrary.artistCount === 1 ? 'artist' : 'artists'}
					</p>
				{/if}
			</div>

			<div class="mb-8">
				<OverallStatsDisplay
					totalResponses={snapshot.totalResponses}
					totalSessions={snapshot.totalSessions}
					neitherRate={snapshot.neitherRate ?? neitherRate}
					avgResponseTimeMs={snapshot.avgResponseTimeMs}
				/>
			</div>

			<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				<!-- Row 1: Codec win rates (lead) + bitrate tier -->
				<div class="rounded-xl border bg-card p-6 md:col-span-2">
					<CodecWinRateBarChart
						flacWinRate={snapshot.flacWinRate}
						flacComparisons={snapshot.flacComparisons}
						opusWinRate={snapshot.opusWinRate}
						opusComparisons={snapshot.opusComparisons}
						aacWinRate={snapshot.aacWinRate}
						aacComparisons={snapshot.aacComparisons}
						mp3WinRate={snapshot.mp3WinRate}
						mp3Comparisons={snapshot.mp3Comparisons}
						{codecWinRates}
					/>
				</div>
				<div class="rounded-xl border bg-card p-6">
					<BitrateTierChart
						lossless={snapshot.bitrateLosslessWinRate}
						high={snapshot.bitrateHighWinRate}
						mid={snapshot.bitrateMidWinRate}
						low={snapshot.bitrateLowWinRate}
					/>
				</div>

				<!-- Row 2: Headline matchups, device distribution, comparison type -->
				<div class="rounded-xl border bg-card p-6">
					<HeadlineMatchupsDisplay
						losslessWins={snapshot.losslessVsLossyLosslessWins}
						losslessTotal={snapshot.losslessVsLossyTotal}
						opusWins={snapshot.opusVsMp3OpusWins}
						opusTotal={snapshot.opusVsMp3Total}
						aacWins={snapshot.aacVsMp3AacWins}
						aacTotal={snapshot.aacVsMp3Total}
					/>
				</div>
				<div class="rounded-xl border bg-card p-6">
					<DeviceDistributionChart
						headphonesCount={snapshot.deviceHeadphonesCount}
						speakersCount={snapshot.deviceSpeakersCount}
						budgetCount={snapshot.tierBudgetCount}
						midCount={snapshot.tierMidCount}
						premiumCount={snapshot.tierPremiumCount}
						flagshipCount={snapshot.tierFlagshipCount}
						{deviceBreakdown}
					/>
				</div>
				<div class="rounded-xl border bg-card p-6">
					<ComparisonTypeDistributionChart
						sameGapless={snapshot.comparisonSameGaplessCount}
						sameGap={snapshot.comparisonSameGapCount}
						differentGapless={snapshot.comparisonDifferentGaplessCount}
						differentGap={snapshot.comparisonDifferentGapCount}
					/>
				</div>

				<!-- PQ Line Chart (main insight) -->
				{#if Object.keys(btScores).length > 0}
					<div class="rounded-xl border bg-card p-6 md:col-span-2 lg:col-span-3">
						<PqLineChart scores={btScores} />
					</div>
				{/if}

				<!-- Codec matchup heatmap -->
				{#if snapshot?.codecMatchupMatrix && Object.keys(snapshot.codecMatchupMatrix).length > 0}
					<div class="rounded-xl border bg-card p-6 md:col-span-2 lg:col-span-3">
						<CodecMatchupHeatmap matrix={snapshot.codecMatchupMatrix} />
					</div>
				{:else if heatmapData.length > 0}
					{#await import('@vesta-cx/ui/components/ui/heatmap') then { Heatmap }}
						<div class="rounded-xl border bg-card p-6 md:col-span-2 lg:col-span-3">
							<h3 class="text-sm font-medium text-muted-foreground">Codec × Bitrate Win Rates</h3>
							<div class="mt-4">
								<Heatmap
									data={heatmapData}
									rows={[...new Set(heatmapData.map((d) => d.row))]}
									cols={[...new Set(heatmapData.map((d) => d.col))]}
									rowLabel="Codec"
									colLabel="Bitrate (kbps)"
								/>
							</div>
						</div>
					{/await}
				{/if}

				<!-- Equivalence + FLAC vs lossy + Neither -->
				{#if snapshot?.codecEquivalenceRatios && Object.keys(snapshot.codecEquivalenceRatios).length > 0}
					<div class="rounded-xl border bg-card p-6">
						<CodecEquivalenceChart ratios={snapshot.codecEquivalenceRatios} />
					</div>
				{/if}
				{#if Object.keys(flacVsLossy).length > 0}
					<div class="rounded-xl border bg-card p-6">
						<FlacVsLossyChart data={flacVsLossy} />
					</div>
				{/if}
				{#if Object.keys(neitherByBitrateDiff).length > 0}
					<div class="rounded-xl border bg-card p-6">
						<NeitherByDiffChart data={neitherByBitrateDiff} />
					</div>
				{/if}

				{#if Object.keys(btScores).length > 0}
					<div class="rounded-xl border bg-card p-6">
						<StatCard.StatCard label="Quality Rankings" helper="Bradley-Terry model scores">
							<div class="space-y-2">
								{#each Object.entries(btScores).sort(([, a], [, b]) => b - a) as [key, score], i}
									<div class="flex items-center justify-between text-sm">
										<div class="flex items-center gap-2">
											<span class="w-5 text-xs text-muted-foreground">#{i + 1}</span>
											<span class="font-medium">{key}</span>
										</div>
										<span class="text-muted-foreground">{score.toFixed(2)}</span>
									</div>
								{/each}
							</div>
						</StatCard.StatCard>
					</div>
				{/if}

				<!-- Genre visualizations -->
				{#if snapshot?.codecPqScoresByGenre && Object.keys(snapshot.codecPqScoresByGenre).length > 0}
					<div class="rounded-xl border bg-card p-6 md:col-span-2">
						<PqConfidenceBandChart scoresByGenre={snapshot.codecPqScoresByGenre} />
					</div>
					<div class="rounded-xl border bg-card p-6 md:col-span-2">
						<PqSpaghettiChart scoresByGenre={snapshot.codecPqScoresByGenre} codec="opus" />
					</div>
					<div class="rounded-xl border bg-card p-6 md:col-span-2 lg:col-span-3">
						<GenreHeatmapChart scoresByGenre={snapshot.codecPqScoresByGenre} />
					</div>
				{/if}
			</div>

			<CodecDescriptions {codecs} descriptions={codecDescriptions} class="mt-12" />
		{:else}
			<div class="mx-auto max-w-md py-20">
				<Empty.Empty>
					<Empty.Media variant="icon">
						<span class="text-2xl">🎧</span>
					</Empty.Media>
					<Empty.Header>
						<Empty.Title>Not enough data yet</Empty.Title>
						<Empty.Description>
							We need more listening data before we can show meaningful visualizations. Every
							comparison you complete helps us build a clearer picture of how audio codecs are
							perceived.
						</Empty.Description>
					</Empty.Header>
					<Empty.Content>
						<a
							href="/survey/setup"
							class="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
						>
							Play the first round
						</a>
					</Empty.Content>
				</Empty.Empty>
			</div>

			<CodecDescriptions {codecs} descriptions={codecDescriptions} class="mt-8" />
		{/if}
	</SectionContent>
</Section>
