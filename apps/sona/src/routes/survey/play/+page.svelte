<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { pageTitle } from '$lib/constants/identity';
	import * as AlertDialog from '@vesta-cx/ui/components/ui/alert-dialog';
	import * as Empty from '@vesta-cx/ui/components/ui/empty';
	import * as Popover from '@vesta-cx/ui/components/ui/popover';
	import * as Tooltip from '@vesta-cx/ui/components/ui/tooltip';
	import ComparisonSettingsPopover from '$lib/components/comparison-settings-popover.svelte';
	import { Anchor } from '@vesta-cx/ui/components/utils/anchor';
	import TrackLabel from '$lib/components/track-label.svelte';
	import { formatTrackLabel } from '$lib/utils/list';
	import InfoIcon from '@lucide/svelte/icons/info';
	import PowerIcon from '@lucide/svelte/icons/power';
	let { data } = $props();

	let submitting = $state(false);
	let responseStartTime = $state(0);
	let exitDialogOpen = $state(false);
	/** Client-side round counter (resets on exit; not persisted) */
	let roundNumber = $state(1);
	type RoundHistoryEntry = {
		round: number;
		labelA: string;
		labelB: string;
		streamUrlA: string | null;
		streamUrlB: string | null;
	};
	/** Completed rounds this session (for round recap popover) */
	let roundHistory = $state<RoundHistoryEntry[]>([]);

	/** Next round at which to show an easter egg (randomized 17–23 interval per session) */
	let nextEasterEggRound = $state(17 + Math.floor(Math.random() * 7));
	/** Easter egg message for current summary, fetched from API when round hits threshold */
	let easterEggMessage = $state<string | null>(null);
	/** This round is an easter-egg round; block Next until message fetched + typewriter done */
	let easterEggExpected = $state(false);
	/** Typewriter: characters shown so far */
	let easterEggDisplayedText = $state('');
	/** Typewriter finished; Next can proceed when easter egg round */
	let easterEggAnimationDone = $state(false);

	const TRANSITION_LABELS: Record<string, string> = {
		gapless: 'Gapless',
		gap_continue: 'Gap (continue)',
		gap_restart: 'Gap (restart)',
		gap_pause_resume: 'Gap (pause/resume)'
	};

	const getTransitionLabel = (
		mode: string,
		labelA: {
			title: string;
			artist?: string | null;
			featuredArtists?: string | null;
			remixArtists?: string | null;
		},
		labelB: {
			title: string;
			artist?: string | null;
			featuredArtists?: string | null;
			remixArtists?: string | null;
		}
	): string => {
		if (formatTrackLabel(labelA) !== formatTrackLabel(labelB)) return 'Different songs';
		return TRANSITION_LABELS[mode] ?? mode;
	};

	const TRANSITION_TOOLTIPS: Record<string, string> = {
		gapless:
			'No pause between switching—A and B play seamlessly. Any tiny lag you notice is normal.',
		gap_continue:
			'Brief pause when switching; playback continues from where the other stopped. The lag is expected.',
		gap_restart:
			'Brief pause when switching; playback restarts from the segment start. The lag is expected.',
		gap_pause_resume:
			'Brief pause when switching; each track resumes from where you left it. No syncing between A and B.'
	};

	const formatLabel = formatTrackLabel;

	type SubmittedPayload = {
		selected: 'a' | 'b' | 'neither';
		labelA: string;
		labelB: string;
		streamUrlA: string | null;
		streamUrlB: string | null;
		isDifferentSong: boolean;
	};
	let submitted = $state<SubmittedPayload | null>(null);

	$effect(() => {
		if (data.round && !submitted) {
			responseStartTime = Date.now();
		}
	});

	$effect(() => {
		const isEasterEggRound = data.isAdmin || roundNumber === nextEasterEggRound;
		if (!submitted || !isEasterEggRound) return;
		easterEggExpected = true;
		const round = roundNumber;
		if (!data.isAdmin) {
			nextEasterEggRound = round + 17 + Math.floor(Math.random() * 7);
		}
		fetch('/api/easter-egg')
			.then((r) => r.json())
			.then((body: { message: string | null }) => {
				if (body.message) {
					easterEggMessage = body.message;
				} else {
					easterEggAnimationDone = true;
				}
			})
			.catch(() => {
				easterEggAnimationDone = true;
			});
	});

	$effect(() => {
		if (!easterEggMessage) {
			easterEggDisplayedText = '';
			return;
		}
		easterEggDisplayedText = '';
		easterEggAnimationDone = false;
		let i = 0;
		const delay = 45;
		const id = setInterval(() => {
			i += 1;
			if (i <= easterEggMessage!.length) {
				easterEggDisplayedText = easterEggMessage!.slice(0, i);
			} else {
				clearInterval(id);
				easterEggAnimationDone = true;
			}
		}, delay);
		return () => clearInterval(id);
	});

	const handleConfirm = async (
		selected: 'a' | 'b' | 'neither',
		playbackPositionSeconds?: number
	) => {
		if (submitting || !data.round) return;
		submitting = true;

		const responseTime = Date.now() - responseStartTime;
		const playbackPositionMs =
			typeof playbackPositionSeconds === 'number'
				? Math.round(playbackPositionSeconds * 1000)
				: undefined;

		try {
			const res = await fetch('/api/answers', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					tokenA: data.round.tokenA,
					tokenB: data.round.tokenB,
					tokenYwltA: data.round.tokenYwltA ?? undefined,
					tokenYwltB: data.round.tokenYwltB ?? undefined,
					selected,
					transitionMode: data.round.transitionMode,
					roundMode: data.round.roundMode ?? undefined,
					startTime: data.round.startTime,
					segmentDuration: data.round.duration,
					responseTime,
					deviceId: data.deviceId,
					sessionId: data.sessionId ?? undefined,
					playbackPositionMs
				})
			});

			if (!res.ok) {
				submitting = false;
				return;
			}

			const labelAStr = formatTrackLabel(data.round.labelA);
			const labelBStr = formatTrackLabel(data.round.labelB);
			submitted = {
				selected,
				labelA: labelAStr,
				labelB: labelBStr,
				streamUrlA: data.round.labelA?.streamUrl ?? null,
				streamUrlB: data.round.labelB?.streamUrl ?? null,
				isDifferentSong: labelAStr !== labelBStr
			};
			roundHistory = [
				...roundHistory,
				{
					round: roundNumber,
					labelA: labelAStr,
					labelB: labelBStr,
					streamUrlA: data.round.labelA?.streamUrl ?? null,
					streamUrlB: data.round.labelB?.streamUrl ?? null
				}
			];
		} catch {
			// Swallow; submitting = false in finally
		} finally {
			submitting = false;
		}
	};

	let playbackRef: { fadeOut: () => Promise<void> } | undefined;

	const canProceed = $derived(!easterEggExpected || easterEggAnimationDone);

	const handleNext = async () => {
		if (submitting || !canProceed) return;
		submitting = true;
		easterEggMessage = null;
		easterEggExpected = false;
		easterEggDisplayedText = '';
		easterEggAnimationDone = false;
		submitted = null;
		roundNumber += 1;
		if (playbackRef) {
			await playbackRef.fadeOut();
		}
		await invalidateAll();
		submitting = false;
	};

	const handleExitConfirm = () => {
		exitDialogOpen = false;
		goto('/');
	};

	const handleKeyDown = (e: KeyboardEvent) => {
		if (exitDialogOpen) {
			if (e.key === 'Escape') {
				e.preventDefault();
				exitDialogOpen = false;
			} else if (e.key === ' ' || e.key === 'Enter') {
				e.preventDefault();
				handleExitConfirm();
			}
			return;
		}
		if ((e.key === ' ' || e.key === 'Enter') && submitted && !submitting && canProceed) {
			e.preventDefault();
			handleNext();
		} else if (e.key === 'Escape') {
			e.preventDefault();
			exitDialogOpen = true;
		}
	};

	let enabledModes = $state<string[]>([]);
	let allowDifferentSong = $state(true);

	$effect(() => {
		enabledModes = [...(data.enabledModes ?? [])];
		allowDifferentSong = data.allowDifferentSong ?? true;
	});

	const handleSaveModes = async () => {
		try {
			const res = await fetch('/api/settings/transition-modes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					modes: enabledModes,
					allowDifferentSong
				})
			});
			if (res.ok) {
				await invalidateAll();
			}
		} catch {
			// Swallow
		}
	};

	const setModeEnabled = (mode: string, checked: boolean) => {
		if (checked) {
			if (!enabledModes.includes(mode)) {
				enabledModes = [...enabledModes, mode];
			}
		} else if (enabledModes.length > 1) {
			enabledModes = enabledModes.filter((m) => m !== mode);
		}
	};
</script>

<svelte:window onkeydown={handleKeyDown} />

<svelte:head>
	<title>{pageTitle('Play')}</title>
</svelte:head>

<div class="relative min-h-screen">
	<!-- Exit confirmation dialog -->
	<AlertDialog.Root open={exitDialogOpen} onOpenChange={(v) => (exitDialogOpen = v)}>
		<AlertDialog.Portal>
			<AlertDialog.Overlay />
			<AlertDialog.Content
				onkeydown={(e) => {
					if (e.key === 'Escape') {
						e.preventDefault();
						e.stopPropagation();
						exitDialogOpen = false;
					}
				}}
			>
				<AlertDialog.Header>
					<AlertDialog.Title>Exit game?</AlertDialog.Title>
					<AlertDialog.Description>
						Fat-finger that Escape key? Your answers are saved—we just want to be sure you meant to
						leave.
					</AlertDialog.Description>
				</AlertDialog.Header>
				<AlertDialog.Footer>
					<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
					<AlertDialog.Action onclick={handleExitConfirm}>Exit</AlertDialog.Action>
				</AlertDialog.Footer>
			</AlertDialog.Content>
		</AlertDialog.Portal>
	</AlertDialog.Root>

	{#if data.error}
		<div class="flex min-h-screen flex-col items-center justify-center px-4 py-8">
			<Empty.Root class="container border-0 text-center">
				<Empty.Title class="text-2xl font-bold">No comparisons available</Empty.Title>
				<Empty.Description class="mt-2">{data.error}</Empty.Description>
				<Empty.Content class="mt-4">
					<a
						href="/"
						class="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
					>
						Back to Home
					</a>
				</Empty.Content>
			</Empty.Root>
		</div>
	{:else if submitting && !data.round}
		<div class="flex h-48 items-center justify-center text-sm text-muted-foreground">
			Loading next round...
		</div>
	{:else if data.round}
		<div class="relative">
			{#await import('$lib/components/audio-player')}
				<div class="flex min-h-screen items-center justify-center">
					<p class="text-muted-foreground">Loading player...</p>
				</div>
			{:then { AudioPlayer }}
				{#key data.round.tokenA}
					<AudioPlayer
						bind:this={playbackRef}
						srcA="/api/stream/{data.round.tokenA}"
						srcB="/api/stream/{data.round.tokenB}"
						srcYwltA={data.round.tokenYwltA ? `/api/stream/${data.round.tokenYwltA}` : null}
						srcYwltB={data.round.tokenYwltB ? `/api/stream/${data.round.tokenYwltB}` : null}
						transitionMode={data.round.transitionMode}
						startTime={data.round.startTime}
						duration={data.round.duration}
						onConfirm={handleConfirm}
					>
						{#snippet header()}
							<!-- Quit: top-left on mobile -->
							<button
								type="button"
								onclick={() => (exitDialogOpen = true)}
								class="col-start-1 row-start-1 flex items-center gap-2 self-start justify-self-start rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
								aria-label="Quit"
							>
								<PowerIcon class="size-4" />
								<span class="hidden sm:inline">Quit</span>
							</button>
							<!-- Title + Tooltip: top-center (row 1) -->
							<div
								class="col-start-2 row-start-1 flex flex-col items-center gap-1 self-start justify-self-center"
							>
								<h1 class="text-center text-2xl font-bold tracking-tight">Which do you prefer?</h1>
								<div class="flex items-center justify-center">
									<Popover.Root>
										<Popover.Trigger
											class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
											aria-label="Transition mode"
										>
											<span class="capitalize"
												>{getTransitionLabel(
													data.round.transitionMode,
													data.round.labelA,
													data.round.labelB
												)}</span
											>
											<InfoIcon class="size-3.5" />
										</Popover.Trigger>
										<Popover.Content
											class="w-fit max-w-[16rem] p-3 text-xs"
											align="center"
											side="bottom"
										>
											{TRANSITION_TOOLTIPS[data.round.transitionMode] ??
												'Switching behavior for this comparison.'}
										</Popover.Content>
									</Popover.Root>
								</div>
							</div>
							<!-- Round: top-right (row 1) -->
							<Popover.Root>
								<Popover.Trigger
									class="col-start-3 row-start-1 flex items-center justify-end gap-2 self-start justify-self-end rounded-lg transition-colors hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring"
									aria-label="Round {roundNumber} - click to view previous rounds"
								>
									<span class="hidden text-sm font-medium text-muted-foreground sm:inline"
										>Round</span
									>
									<span
										class="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted/60 text-sm font-semibold text-muted-foreground"
									>
										{roundNumber}
									</span>
								</Popover.Trigger>
								<Popover.Content
									class="max-h-80 w-72 overflow-y-auto p-3"
									align="end"
									side="bottom"
								>
									<p
										class="mb-2 text-xs font-medium tracking-wider text-muted-foreground uppercase"
									>
										Rounds this session
									</p>
									{#if roundHistory.length === 0}
										<p class="text-sm text-muted-foreground">No rounds completed yet.</p>
									{:else}
										<ul class="flex flex-col gap-2 text-sm">
											{#each roundHistory as entry}
												<li
													class="flex flex-col gap-1 border-b border-border pb-2 last:border-0 last:pb-0"
												>
													<span class="font-medium">Round {entry.round}</span>
													{#if entry.labelA === entry.labelB}
														{#if entry.streamUrlA}
															<Anchor
																href={entry.streamUrlA}
																class="text-xs text-primary hover:underline"
															>
																{entry.labelA}
															</Anchor>
														{:else}
															<span class="text-xs text-muted-foreground">{entry.labelA}</span>
														{/if}
													{:else}
														{#if entry.streamUrlA}
															<Anchor
																href={entry.streamUrlA}
																class="text-xs text-primary hover:underline"
															>
																{entry.labelA}
															</Anchor>
														{:else}
															<span class="text-xs text-muted-foreground">{entry.labelA}</span>
														{/if}
														{#if entry.streamUrlB}
															<Anchor
																href={entry.streamUrlB}
																class="text-xs text-primary hover:underline"
															>
																{entry.labelB}
															</Anchor>
														{:else}
															<span class="text-xs text-muted-foreground">{entry.labelB}</span>
														{/if}
													{/if}
												</li>
											{/each}
										</ul>
									{/if}
								</Popover.Content>
							</Popover.Root>
							<!-- Settings: bottom-left (row 3) -->
							<div class="col-start-1 row-start-3 self-end justify-self-start">
								<ComparisonSettingsPopover
									{enabledModes}
									{allowDifferentSong}
									{setModeEnabled}
									onAllowDifferentSongChange={(v) => (allowDifferentSong = v)}
									onSave={handleSaveModes}
									transitionLabels={TRANSITION_LABELS}
									transitionTooltips={TRANSITION_TOOLTIPS}
								/>
							</div>
						{/snippet}
					</AudioPlayer>
				{/key}
			{/await}

			{#if submitted}
				<!-- roundSummary: post-comparison overlay -->
				<div
					class="pointer-events-auto absolute inset-0 z-10 flex items-center justify-center bg-background/95 backdrop-blur-sm"
				>
					<div
						class="grid min-h-screen w-full grid-cols-[0.5fr_2fr_0.5fr] grid-rows-[repeat(3,minmax(0,1fr))] gap-x-4 gap-y-2 px-6 py-6 md:container md:min-h-[min(95vh,720px)] md:grid-rows-[auto_auto_auto] md:items-center md:justify-items-center [&_[role='button']]:pointer-events-auto [&_button]:pointer-events-auto [&_input]:pointer-events-auto"
					>
						<!-- Quit: top-left (row 1) -->
						<button
							type="button"
							onclick={() => (exitDialogOpen = true)}
							class="col-start-1 row-start-1 flex items-center gap-2 self-start justify-self-start rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
							aria-label="Quit"
						>
							<PowerIcon class="size-4" />
							<span class="hidden sm:inline">Quit</span>
						</button>
						<!-- Round: top-right (row 1) -->
						<Popover.Root>
							<Popover.Trigger
								class="col-start-3 row-start-1 flex items-center justify-end gap-2 self-start justify-self-end rounded-lg transition-colors hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring"
								aria-label="Round {roundNumber} - click to view previous rounds"
							>
								<span class="hidden text-sm font-medium text-muted-foreground sm:inline">Round</span
								>
								<span
									class="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted/60 text-sm font-semibold text-muted-foreground"
								>
									{roundNumber}
								</span>
							</Popover.Trigger>
							<Popover.Content class="max-h-80 w-72 overflow-y-auto p-3" align="end" side="bottom">
								<p class="mb-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
									Rounds this session
								</p>
								{#if roundHistory.length === 0}
									<p class="text-sm text-muted-foreground">No rounds completed yet.</p>
								{:else}
									<ul class="flex flex-col gap-2 text-sm">
										{#each roundHistory as entry}
											<li
												class="flex flex-col gap-1 border-b border-border pb-2 last:border-0 last:pb-0"
											>
												<span class="font-medium">Round {entry.round}</span>
												{#if entry.labelA === entry.labelB}
													{#if entry.streamUrlA}
														<Anchor
															href={entry.streamUrlA}
															class="text-xs text-primary hover:underline"
														>
															{entry.labelA}
														</Anchor>
													{:else}
														<span class="text-xs text-muted-foreground">{entry.labelA}</span>
													{/if}
												{:else}
													{#if entry.streamUrlA}
														<Anchor
															href={entry.streamUrlA}
															class="text-xs text-primary hover:underline"
														>
															{entry.labelA}
														</Anchor>
													{:else}
														<span class="text-xs text-muted-foreground">{entry.labelA}</span>
													{/if}
													{#if entry.streamUrlB}
														<Anchor
															href={entry.streamUrlB}
															class="text-xs text-primary hover:underline"
														>
															{entry.labelB}
														</Anchor>
													{:else}
														<span class="text-xs text-muted-foreground">{entry.labelB}</span>
													{/if}
												{/if}
											</li>
										{/each}
									</ul>
								{/if}
							</Popover.Content>
						</Popover.Root>
						<!-- Center: Round summary title + You submitted / You were listening to (row 2) -->
						<div
							class="col-start-2 row-start-2 flex flex-col items-center justify-center gap-4 self-center justify-self-center text-center md:place-self-center"
						>
							<h2 class="text-xl font-bold tracking-tight">Round summary</h2>
							<p class="text-sm text-muted-foreground">
								You submitted
								{submitted.selected === 'neither' ? 'neither' : submitted.selected.toUpperCase()}.
							</p>
							<TrackLabel
								labelA={submitted.labelA}
								labelB={submitted.labelB}
								selected={submitted.selected}
								streamUrlA={submitted.streamUrlA}
								streamUrlB={submitted.streamUrlB}
								isDifferentSong={submitted.isDifferentSong}
							/>
							{#if easterEggExpected}
								<p class="text-sm text-foreground italic">
									{#if easterEggMessage}
										"{easterEggDisplayedText}"
									{:else}
										...
									{/if}
								</p>
							{/if}
						</div>
						<!-- Settings: bottom-left (row 3) -->
						<div class="col-start-1 row-start-3 self-end justify-self-start">
							<ComparisonSettingsPopover
								{enabledModes}
								{allowDifferentSong}
								{setModeEnabled}
								onAllowDifferentSongChange={(v) => (allowDifferentSong = v)}
								onSave={handleSaveModes}
								transitionLabels={TRANSITION_LABELS}
								transitionTooltips={TRANSITION_TOOLTIPS}
							/>
						</div>
						<!-- Next + shortcuts tooltip (hover): bottom-center (row 3, same position as Confirm) -->
						<div
							class="col-start-2 row-start-3 flex w-full max-w-xs flex-col items-center gap-2 self-end justify-self-center"
						>
							<div class="hidden md:block">
								<Tooltip.Provider delayDuration={0}>
									<Tooltip.Root>
										<Tooltip.Trigger
											class="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
											aria-label="Keyboard shortcuts"
										>
											Shortcuts
											<InfoIcon class="size-3.5" />
										</Tooltip.Trigger>
										<Tooltip.Portal>
											<Tooltip.Content
												arrowClasses="bg-popover"
												class="max-w-xs border border-border bg-popover text-popover-foreground shadow-md [&_kbd]:rounded-sm [&_kbd]:border [&_kbd]:border-border [&_kbd]:bg-muted [&_kbd]:px-1.5 [&_kbd]:py-0.5 [&_kbd]:font-mono [&_kbd]:text-[0.65rem] [&_kbd]:font-medium [&_kbd]:text-foreground"
											>
												{#if canProceed}
													Press <kbd>Space</kbd> or <kbd>Enter</kbd> to continue
												{:else}
													Wait for the message to finish...
												{/if}
											</Tooltip.Content>
										</Tooltip.Portal>
									</Tooltip.Root>
								</Tooltip.Provider>
							</div>
							<button
								type="button"
								onclick={handleNext}
								disabled={submitting || !canProceed}
								class="w-full rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
								aria-label="Next comparison"
							>
								{submitting ? 'Loading...' : !canProceed ? '...' : 'Next'}
							</button>
						</div>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
