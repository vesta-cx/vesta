<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export type TransitionMode = 'gapless' | 'gap_continue' | 'gap_restart' | 'gap_pause_resume';
	export type Selection = 'a' | 'b' | 'neither' | null;

	export interface AudioPlayerProps {
		srcA: string;
		srcB: string;
		/** Opus_128 URLs for "you were listening to" preload. Preload both; crossfade to selected on confirm. */
		srcYwltA?: string | null;
		srcYwltB?: string | null;
		transitionMode: TransitionMode;
		startTime: number;
		duration: number;
		onConfirm: (selection: 'a' | 'b' | 'neither', playbackPositionSeconds?: number) => void;
		class?: string;
		/** Content to render in the floating header area (e.g. home button, title, settings) */
		header?: Snippet;
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import * as Popover from '@vesta-cx/ui/components/ui/popover';
	import * as Tooltip from '@vesta-cx/ui/components/ui/tooltip';
	import Volume2Icon from '@lucide/svelte/icons/volume-2';
	import InfoIcon from '@lucide/svelte/icons/info';
	import { cn } from '$lib/utils.js';

	const GAP_DURATION_MS = 300;
	/** Crossfade duration; 80–100ms helps avoid clicks from waveform discontinuities */
	const CROSSFADE_MS = 80;
	const VOLUME_STEP = 0.05;
	const LOAD_TIMEOUT_MS = 30_000;

	let {
		srcA,
		srcB,
		srcYwltA = null,
		srcYwltB = null,
		transitionMode,
		startTime,
		duration,
		onConfirm,
		class: className,
		header
	}: AudioPlayerProps = $props();

	// Web Audio internals — plain variables, NOT $state.
	// Svelte 5 wraps $state objects in Proxies for deep reactivity.
	// Browser API objects (AudioContext, GainNode, etc.) break when proxied,
	// and the proxy reads create phantom dependencies that re-trigger $effects.
	let audioCtx: AudioContext | null = null;
	let elA: HTMLAudioElement | null = null;
	let elB: HTMLAudioElement | null = null;
	let elYwltA: HTMLAudioElement | null = null;
	let elYwltB: HTMLAudioElement | null = null;
	let sourceA: MediaElementAudioSourceNode | null = null;
	let sourceB: MediaElementAudioSourceNode | null = null;
	let sourceYwltA: MediaElementAudioSourceNode | null = null;
	let sourceYwltB: MediaElementAudioSourceNode | null = null;
	let gainNodeA: GainNode | null = null;
	let gainNodeB: GainNode | null = null;
	let gainNodeYwlt: GainNode | null = null;
	let masterGain: GainNode | null = null;
	let blobUrlA: string | null = null;
	let blobUrlB: string | null = null;
	let blobUrlYwltA: string | null = null;
	let blobUrlYwltB: string | null = null;

	// Reactive state — only values the template needs to read
	let selection: Selection = $state(null);
	let isPlaying = $state(false);
	let isLoading = $state(true);
	let loadError: string | null = $state(null);
	let volume = $state(0.8);
	let confirmed = $state(false);
	let playbackOffset = $state(0);
	let keyboardMode = $state(false);
	let stopTimeoutId: ReturnType<typeof setTimeout> | null = null;
	/** Pending gap-transition timeout (gap_continue, gap_restart); cancel when scheduling a new one */
	let gapTimeoutId: ReturnType<typeof setTimeout> | null = null;
	/** Position to continue from when next track plays (gap_continue); used when switching again before pending transition fires */
	let continuationOffsetForGap = 0;
	/** Per-track offsets for gap_pause_resume (different songs): each resumes where left off */
	let lastOffsetA = 0;
	let lastOffsetB = 0;

	const isDesktop = $derived(typeof window !== 'undefined' && window.innerWidth >= 768);

	const startTimeSeconds = $derived(startTime / 1000);
	const durationSeconds = $derived(duration / 1000);
	const segmentEndSeconds = $derived(startTimeSeconds + durationSeconds);

	const handleLoadError = (msg: string) => {
		loadError = msg;
		isLoading = false;
	};

	const initAudio = async () => {
		if (typeof window === 'undefined') return;

		try {
			audioCtx = new AudioContext();
			masterGain = audioCtx.createGain();
			masterGain.gain.value = untrack(() => volume); // read once, no dependency
			masterGain.connect(audioCtx.destination);

			gainNodeA = audioCtx.createGain();
			gainNodeB = audioCtx.createGain();
			gainNodeYwlt = audioCtx.createGain();
			gainNodeA.gain.value = 0;
			gainNodeB.gain.value = 0;
			gainNodeYwlt.gain.value = 0;
			gainNodeA.connect(masterGain);
			gainNodeB.connect(masterGain);
			gainNodeYwlt.connect(masterGain);

			// Fetch comparison streams (A, B) and YWLT opus_128 in parallel
			const fetchPromises: Promise<Response>[] = [fetch(srcA), fetch(srcB)];
			if (srcYwltA) fetchPromises.push(fetch(srcYwltA));
			if (srcYwltB) fetchPromises.push(fetch(srcYwltB));
			const responses = await Promise.all(fetchPromises);
			const resA = responses[0];
			const resB = responses[1];
			const resYwltA = responses[2];
			const resYwltB = responses[3];
			if (!resA.ok || !resB.ok) {
				handleLoadError('Failed to load audio segments');
				return;
			}
			const blobPromises: Promise<Blob>[] = [resA.blob(), resB.blob()];
			if (resYwltA?.ok) blobPromises.push(resYwltA.blob());
			if (resYwltB?.ok) blobPromises.push(resYwltB.blob());
			const blobs = await Promise.all(blobPromises);
			blobUrlA = URL.createObjectURL(blobs[0]);
			blobUrlB = URL.createObjectURL(blobs[1]);
			if (blobs[2]) blobUrlYwltA = URL.createObjectURL(blobs[2] as Blob);
			if (blobs[3]) blobUrlYwltB = URL.createObjectURL(blobs[3] as Blob);

			elA = new Audio(blobUrlA);
			elB = new Audio(blobUrlB);
			if (blobUrlYwltA) elYwltA = new Audio(blobUrlYwltA);
			if (blobUrlYwltB) elYwltB = new Audio(blobUrlYwltB);

			const loadWithTimeout = (el: HTMLAudioElement, label: string): Promise<void> =>
				new Promise((resolve, reject) => {
					const timeout = setTimeout(() => {
						reject(new Error(`${label} timed out after ${LOAD_TIMEOUT_MS / 1000}s`));
					}, LOAD_TIMEOUT_MS);
					el.oncanplay = () => {
						clearTimeout(timeout);
						resolve();
					};
					el.onerror = () => {
						clearTimeout(timeout);
						reject(new Error(`${label} failed to load`));
					};
				});

			const loadPromises = [loadWithTimeout(elA, 'Stream A'), loadWithTimeout(elB, 'Stream B')];
			if (elYwltA) loadPromises.push(loadWithTimeout(elYwltA, 'YWLT A'));
			if (elYwltB) loadPromises.push(loadWithTimeout(elYwltB, 'YWLT B'));
			await Promise.all(loadPromises);

			sourceA = audioCtx.createMediaElementSource(elA);
			sourceB = audioCtx.createMediaElementSource(elB);
			sourceA.connect(gainNodeA);
			sourceB.connect(gainNodeB);
			if (elYwltA) {
				sourceYwltA = audioCtx.createMediaElementSource(elYwltA);
				sourceYwltA.connect(gainNodeYwlt);
			}
			if (elYwltB) {
				sourceYwltB = audioCtx.createMediaElementSource(elYwltB);
				sourceYwltB.connect(gainNodeYwlt);
			}

			isLoading = false;
		} catch (e) {
			handleLoadError(e instanceof Error ? e.message : 'Failed to load audio streams');
		}
	};

	$effect(() => {
		initAudio();
		return () => {
			clearGapTimeout();
			stopAll();
			elA?.pause();
			elB?.pause();
			elYwltA?.pause();
			elYwltB?.pause();
			if (blobUrlA) URL.revokeObjectURL(blobUrlA);
			if (blobUrlB) URL.revokeObjectURL(blobUrlB);
			if (blobUrlYwltA) URL.revokeObjectURL(blobUrlYwltA);
			if (blobUrlYwltB) URL.revokeObjectURL(blobUrlYwltB);
			blobUrlA = null;
			blobUrlB = null;
			blobUrlYwltA = null;
			blobUrlYwltB = null;
			elA = null;
			elB = null;
			elYwltA = null;
			elYwltB = null;
			audioCtx?.close();
			audioCtx = null;
		};
	});

	$effect(() => {
		if (masterGain) {
			masterGain.gain.value = volume;
		}
	});

	/** Reset per-track offsets when round changes (new srcs or transition mode) */
	$effect(() => {
		if (transitionMode === 'gap_pause_resume') {
			lastOffsetA = startTimeSeconds;
			lastOffsetB = startTimeSeconds;
		}
	});

	const clearStopTimeout = () => {
		if (stopTimeoutId) {
			clearTimeout(stopTimeoutId);
			stopTimeoutId = null;
		}
	};

	const clearGapTimeout = () => {
		if (gapTimeoutId) {
			clearTimeout(gapTimeoutId);
			gapTimeoutId = null;
		}
	};

	const stopAll = () => {
		clearStopTimeout();
		clearGapTimeout();
		// Capture where we stopped before resetting (for gap_continue: "other option stopped here")
		const activeEl = selection === 'a' ? elA : selection === 'b' ? elB : null;
		if (activeEl && isPlaying) {
			playbackOffset = activeEl.currentTime;
		}
		elA?.pause();
		elB?.pause();
		elYwltA?.pause();
		elYwltB?.pause();
		if (elA) elA.currentTime = startTimeSeconds;
		if (elB) elB.currentTime = startTimeSeconds;
		if (transitionMode === 'gap_pause_resume') {
			lastOffsetA = startTimeSeconds;
			lastOffsetB = startTimeSeconds;
		}
		isPlaying = false;
	};

	/** Schedule auto-stop when playback reaches the end of the segment.
	 *  @param currentSeconds — absolute position in the full audio file */
	const scheduleStopAfterDuration = (currentSeconds: number) => {
		clearStopTimeout();
		const remaining = segmentEndSeconds - currentSeconds;
		if (remaining <= 0) return;
		stopTimeoutId = setTimeout(() => {
			if (transitionMode === 'gap_pause_resume') {
				// Pause active track; set its offset to start (loop next time); don't reset other track
				const activeEl = selection === 'a' ? elA : selection === 'b' ? elB : null;
				if (activeEl) {
					if (selection === 'a') lastOffsetA = startTimeSeconds;
					else if (selection === 'b') lastOffsetB = startTimeSeconds;
				}
				elA?.pause();
				elB?.pause();
				isPlaying = false;
			} else {
				playbackOffset = segmentEndSeconds;
				stopAll();
			}
			stopTimeoutId = null;
		}, remaining * 1000);
	};

	/** 50ms fade to avoid clicks; used for crossfade (gapless) and fade-in (gapped) */
	const applyFadeIn = (gainNode: GainNode) => {
		if (!audioCtx) return;
		const now = audioCtx.currentTime;
		gainNode.gain.setValueAtTime(0, now);
		gainNode.gain.linearRampToValueAtTime(1, now + CROSSFADE_MS / 1000);
	};

	/** Gapped modes: fade out outgoing over 50ms, then pause; after gapMs total, run onComplete */
	const scheduleFadeOutThenGap = (outgoing: Selection, onComplete: () => void, gapMs: number) => {
		if (gapTimeoutId) {
			clearTimeout(gapTimeoutId);
			gapTimeoutId = null;
		}
		const outgoingGain = outgoing === 'a' ? gainNodeA : outgoing === 'b' ? gainNodeB : null;
		if (outgoingGain && audioCtx && isPlaying) {
			const now = audioCtx.currentTime;
			outgoingGain.gain.setValueAtTime(outgoingGain.gain.value, now);
			outgoingGain.gain.linearRampToValueAtTime(0, now + CROSSFADE_MS / 1000);
		} else {
			stopAll();
		}
		gapTimeoutId = setTimeout(() => {
			gapTimeoutId = null;
			stopAll();
			onComplete();
		}, gapMs);
	};

	const playCandidate = (candidate: 'a' | 'b', offset = startTimeSeconds) => {
		if (!elA || !elB || !gainNodeA || !gainNodeB) return;

		const gainNode = candidate === 'a' ? gainNodeA : gainNodeB;
		const otherGain = candidate === 'a' ? gainNodeB : gainNodeA;

		if (transitionMode === 'gapless' && audioCtx) {
			const now = audioCtx.currentTime;
			gainNode.gain.setValueAtTime(0, now);
			gainNode.gain.linearRampToValueAtTime(1, now + CROSSFADE_MS / 1000);
			otherGain.gain.setValueAtTime(otherGain.gain.value, now);
			otherGain.gain.linearRampToValueAtTime(0, now + CROSSFADE_MS / 1000);
			elA.currentTime = offset;
			elB.currentTime = offset;
			elA.play();
			elB.play();
		} else {
			gainNode.gain.value = 0;
			otherGain.gain.value = 0;
			const el = candidate === 'a' ? elA : elB;
			el.currentTime = offset;
			el.play();
			applyFadeIn(gainNode);
		}

		isPlaying = true;
		playbackOffset = offset;
		scheduleStopAfterDuration(offset);
	};

	const getCurrentOffset = (activeSelection: Selection): number => {
		if (!elA || !elB || !isPlaying) return playbackOffset;
		const activeEl = activeSelection === 'a' ? elA : activeSelection === 'b' ? elB : null;
		if (!activeEl) return playbackOffset;
		return activeEl.currentTime;
	};

	const handleSelect = (candidate: 'a' | 'b' | 'neither') => {
		if (confirmed) return;

		const prevSelection = selection;
		selection = candidate;

		if (candidate === 'neither') {
			if (transitionMode === 'gapless') {
				// continue playing
			} else {
				stopAll();
			}
			return;
		}

		// Use prevSelection for offset: "other option stopped here" (gap_continue)
		const currentOffset = getCurrentOffset(prevSelection);

		if (prevSelection === candidate && isPlaying) return;

		if (transitionMode === 'gapless') {
			if (!elA || !elB || !gainNodeA || !gainNodeB || !audioCtx) return;
			const gainNode = candidate === 'a' ? gainNodeA : gainNodeB;
			const otherGain = candidate === 'a' ? gainNodeB : gainNodeA;

			const isSwitch = prevSelection === 'a' || prevSelection === 'b';
			let offset =
				prevSelection === null || prevSelection === 'neither' ? startTimeSeconds : currentOffset;
			if (offset >= segmentEndSeconds - 0.01) {
				offset = startTimeSeconds;
			}

			if (isSwitch && isPlaying) {
				// Real crossfade: both elements keep playing; ramp gains without pausing
				const now = audioCtx.currentTime;
				gainNode.gain.setValueAtTime(0, now);
				gainNode.gain.linearRampToValueAtTime(1, now + CROSSFADE_MS / 1000);
				otherGain.gain.setValueAtTime(otherGain.gain.value, now);
				otherGain.gain.linearRampToValueAtTime(0, now + CROSSFADE_MS / 1000);
				playbackOffset = offset;
				scheduleStopAfterDuration(offset);
			} else {
				// First play or after neither: reset and start with crossfade
				stopAll();
				elA.currentTime = offset;
				elB.currentTime = offset;
				const now = audioCtx.currentTime;
				gainNode.gain.setValueAtTime(0, now);
				gainNode.gain.linearRampToValueAtTime(1, now + CROSSFADE_MS / 1000);
				otherGain.gain.setValueAtTime(0, now);
				elA.play();
				elB.play();
				isPlaying = true;
				playbackOffset = offset;
				scheduleStopAfterDuration(offset);
			}
		} else if (transitionMode === 'gap_continue') {
			// Fade out over 50ms, then gap, then fade in new.
			// If we have a pending gap (user switched again before it fired), prevSelection never played — use continuationOffsetForGap.
			let offset: number;
			if (prevSelection === null || prevSelection === 'neither') {
				offset = startTimeSeconds;
			} else if (gapTimeoutId) {
				// Pending transition: prevSelection never played; use stored offset
				offset =
					continuationOffsetForGap >= segmentEndSeconds - 0.01
						? startTimeSeconds
						: continuationOffsetForGap;
			} else {
				offset = currentOffset >= segmentEndSeconds - 0.01 ? startTimeSeconds : currentOffset;
			}
			continuationOffsetForGap = offset;
			scheduleFadeOutThenGap(
				prevSelection,
				() => playCandidate(candidate, offset),
				GAP_DURATION_MS
			);
		} else if (transitionMode === 'gap_pause_resume') {
			// Pause when switching; each track resumes from its own position (no syncing)
			const isSwitch = prevSelection === 'a' || prevSelection === 'b';
			if (isSwitch) {
				// Save current track's position before switching
				if (prevSelection === 'a' && elA) lastOffsetA = elA.currentTime;
				else if (prevSelection === 'b' && elB) lastOffsetB = elB.currentTime;
				elA?.pause();
				elB?.pause();
				clearStopTimeout();
			}
			const offset =
				prevSelection === null || prevSelection === 'neither'
					? startTimeSeconds
					: candidate === 'a'
						? lastOffsetA >= segmentEndSeconds - 0.01
							? startTimeSeconds
							: lastOffsetA
						: lastOffsetB >= segmentEndSeconds - 0.01
							? startTimeSeconds
							: lastOffsetB;
			playCandidate(candidate, offset);
		} else {
			// gap_restart: always restart from segment beginning
			scheduleFadeOutThenGap(
				prevSelection,
				() => playCandidate(candidate, startTimeSeconds),
				GAP_DURATION_MS
			);
		}
	};

	const crossfadeToYwlt = (ywltEl: HTMLAudioElement, positionSeconds: number) => {
		if (!audioCtx || !gainNodeA || !gainNodeB || !gainNodeYwlt) return;
		const now = audioCtx.currentTime;
		gainNodeA.gain.setValueAtTime(gainNodeA.gain.value, now);
		gainNodeA.gain.linearRampToValueAtTime(0, now + CROSSFADE_MS / 1000);
		gainNodeB.gain.setValueAtTime(gainNodeB.gain.value, now);
		gainNodeB.gain.linearRampToValueAtTime(0, now + CROSSFADE_MS / 1000);
		gainNodeYwlt.gain.setValueAtTime(0, now);
		gainNodeYwlt.gain.linearRampToValueAtTime(1, now + CROSSFADE_MS / 1000);
		elA?.pause();
		elB?.pause();
		ywltEl.currentTime = positionSeconds;
		ywltEl.play();
		isPlaying = true;
		clearStopTimeout();
	};

	const handleConfirm = () => {
		if (!selection || confirmed) return;
		confirmed = true;
		const position = getCurrentOffset(selection);

		const ywltEl = selection === 'a' ? elYwltA : selection === 'b' ? elYwltB : null;
		if (ywltEl && gainNodeYwlt) {
			crossfadeToYwlt(ywltEl, position);
		} else {
			stopAll();
		}
		onConfirm(selection, position);
	};

	const handleKeyDown = (e: KeyboardEvent) => {
		if (confirmed) return;

		switch (e.key) {
			case 'ArrowLeft':
				e.preventDefault();
				keyboardMode = true;
				handleSelect('a');
				break;
			case 'ArrowRight':
				e.preventDefault();
				keyboardMode = true;
				handleSelect('b');
				break;
			case 'ArrowUp':
				e.preventDefault();
				keyboardMode = true;
				volume = Math.min(1, volume + VOLUME_STEP);
				break;
			case 'ArrowDown':
				e.preventDefault();
				keyboardMode = true;
				volume = Math.max(0, volume - VOLUME_STEP);
				break;
			case 'n':
			case 'N':
				e.preventDefault();
				keyboardMode = true;
				handleSelect('neither');
				break;
			case ' ':
			case 'Enter':
				e.preventDefault();
				keyboardMode = true;
				handleConfirm();
				break;
		}
	};

	const handleMouseMove = () => {
		keyboardMode = false;
	};

	/** Fade out YWLT playback before Next; used by parent when transitioning away */
	const FADE_OUT_MS = 250;
	const fadeOut = (): Promise<void> => {
		return new Promise((resolve) => {
			if (!audioCtx || !gainNodeYwlt) {
				resolve();
				return;
			}
			const now = audioCtx.currentTime;
			gainNodeYwlt.gain.setValueAtTime(gainNodeYwlt.gain.value, now);
			gainNodeYwlt.gain.linearRampToValueAtTime(0, now + FADE_OUT_MS / 1000);
			elYwltA?.pause();
			elYwltB?.pause();
			setTimeout(() => {
				isPlaying = false;
				resolve();
			}, FADE_OUT_MS);
		});
	};

	export { fadeOut };
</script>

<svelte:window onkeydown={handleKeyDown} />

<div
	class={cn(
		'relative flex min-h-screen w-full flex-col md:flex-row',
		keyboardMode && 'cursor-none',
		className
	)}
	role="group"
	aria-label="Audio comparison player"
>
	{#if isLoading}
		<div class="flex min-h-screen w-full flex-col items-center justify-center">
			<div
				class="flex h-48 w-full max-w-md items-center justify-center rounded-lg border border-dashed"
			>
				<p class="text-sm text-muted-foreground">Loading audio...</p>
			</div>
		</div>
	{:else if loadError}
		<div class="flex min-h-screen w-full flex-col items-center justify-center">
			<div
				class="flex h-48 w-full max-w-md flex-col items-center justify-center gap-2 rounded-lg border border-destructive"
			>
				<p class="text-sm text-destructive">{loadError}</p>
				<p class="text-xs text-muted-foreground">Check your connection and try again.</p>
			</div>
		</div>
	{:else}
		<div class="relative flex min-h-screen w-full flex-col md:flex-row">
			<!-- Fields: full-screen hit targets -->
			<button
				type="button"
				class={cn(
					'h-[50vh] w-full border-2 border-red-500/55 transition-all md:h-screen md:w-[50vw]',
					'[mask-image:linear-gradient(white,white),radial-gradient(circle_44px_at_50%_100%,white,transparent)] [mask-composite:subtract] [mask-size:100%_100%,100%_100%] [mask-position:0_0,0_0] [mask-repeat:no-repeat,no-repeat]',
					'md:[mask-image:linear-gradient(white,white),radial-gradient(circle_44px_at_100%_50%,white,transparent)]',
					'focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset',
					selection === 'a'
						? 'bg-red-500/28 hover:bg-red-500/36'
						: 'bg-red-500/34 hover:bg-red-500/50',
					selection !== 'a' && 'opacity-50'
				)}
				onclick={() => handleSelect('a')}
				aria-label="Play candidate A"
				aria-pressed={selection === 'a'}
				disabled={confirmed}
			/>
			<button
				type="button"
				class={cn(
					'h-[50vh] w-full border-2 border-blue-500/55 transition-all md:h-screen md:w-[50vw]',
					'[mask-image:linear-gradient(white,white),radial-gradient(circle_44px_at_50%_0%,white,transparent)] [mask-composite:subtract] [mask-size:100%_100%,100%_100%] [mask-position:0_0,0_0] [mask-repeat:no-repeat,no-repeat]',
					'md:[mask-image:linear-gradient(white,white),radial-gradient(circle_44px_at_0%_50%,white,transparent)]',
					'focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset',
					selection === 'b'
						? 'bg-blue-500/28 hover:bg-blue-500/36'
						: 'bg-blue-500/34 hover:bg-blue-500/50',
					selection !== 'b' && 'opacity-50'
				)}
				onclick={() => handleSelect('b')}
				aria-label="Play candidate B"
				aria-pressed={selection === 'b'}
				disabled={confirmed}
			/>

			<!-- Labels: .container overlay, centered in each half. Vertical stack on mobile (A top, B bottom), side-by-side on desktop -->
			<div class="pointer-events-none absolute inset-0 flex items-center justify-center">
				<div class="container flex h-full w-full flex-col md:flex-row">
					<div
						class={cn(
							'flex flex-1 flex-col items-center justify-center transition-opacity',
							selection !== 'a' && 'opacity-50'
						)}
					>
						<span class="text-4xl font-bold tracking-tight">A</span>
						<span class="mt-1 text-xs text-muted-foreground">
							{selection === 'a' && isPlaying ? 'Playing...' : 'Click to play'}
						</span>
					</div>
					<div
						class={cn(
							'flex flex-1 flex-col items-center justify-center transition-opacity',
							selection !== 'b' && 'opacity-50'
						)}
					>
						<span class="text-4xl font-bold tracking-tight">B</span>
						<span class="mt-1 text-xs text-muted-foreground">
							{selection === 'b' && isPlaying ? 'Playing...' : 'Click to play'}
						</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Floating UI: full screen on mobile (edge-aligned), container on desktop (centered) -->
		<div
			class="pointer-events-none absolute inset-0 flex items-center justify-center"
			aria-hidden="true"
		>
			<div
				class="pointer-events-none grid min-h-screen w-full grid-cols-[0.5fr_2fr_0.5fr] grid-rows-[repeat(3,minmax(0,1fr))] gap-x-4 gap-y-2 px-6 py-6 md:container md:min-h-[min(95vh,720px)] md:grid-rows-[auto_auto_auto] md:items-center md:justify-items-center [&_[role='button']]:pointer-events-auto [&_button]:pointer-events-auto [&_input]:pointer-events-auto"
			>
				{#if header}
					{@render header()}
				{/if}

				<!-- Neither: row 2 (middle) -->
				<div
					class="col-start-2 row-start-2 flex flex-col items-center justify-center gap-2 self-center justify-self-center md:place-self-center"
				>
					<button
						type="button"
						class={cn(
							'relative flex size-20 items-center justify-center rounded-full border-2 transition-all',
							'bg-card focus-visible:ring-2 focus-visible:ring-ring/50',
							'after:pointer-events-none after:absolute after:inset-0 after:rounded-full after:bg-transparent after:content-[""]',
							selection === 'neither'
								? 'border-orange-500/55 shadow-md after:bg-orange-500/18 hover:after:bg-orange-500/12'
								: 'border-border hover:border-orange-500/30 hover:after:bg-orange-500/12'
						)}
						onclick={() => handleSelect('neither')}
						aria-label="Select neither candidate"
						aria-pressed={selection === 'neither'}
						disabled={confirmed}
					>
						<span
							class="relative z-10 text-xl leading-none text-muted-foreground"
							aria-hidden="true">🤷</span
						>
					</button>
				</div>
				<!-- Volume: row 3 (bottom right, desktop only) -->
				{#if isDesktop}
					<div
						class="col-start-3 row-start-3 flex items-center justify-end self-end justify-self-end md:place-self-end"
					>
						<Popover.Root>
							<Popover.Trigger
								openOnHover
								openDelay={100}
								closeDelay={150}
								class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
								aria-label="Volume"
							>
								<Volume2Icon class="size-5" />
							</Popover.Trigger>
							<Popover.Content class="w-24 min-w-0 p-2" align="end" side="top">
								<div class="flex flex-col items-center gap-2">
									<span class="text-xs text-muted-foreground">
										{Math.round(volume * 100)}%
									</span>
									<div class="flex h-28 items-center justify-center">
										<input
											type="range"
											min="0"
											max="1"
											step="0.01"
											bind:value={volume}
											class="h-2 w-24 cursor-pointer appearance-none rounded-lg bg-muted"
											aria-label="Volume"
											style="transform: rotate(-90deg); transform-origin: center;"
										/>
									</div>
								</div>
							</Popover.Content>
						</Popover.Root>
					</div>
				{/if}

				<!-- Confirm + Shortcuts tooltip (hover): row 3 (bottom) -->
				<div
					class="col-start-2 row-start-3 flex w-full max-w-xs flex-col items-center gap-2 self-end justify-self-center"
				>
					{#if !confirmed}
						<Tooltip.Provider delayDuration={0}>
							<Tooltip.Root>
								<Tooltip.Trigger
									class="hidden inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
									aria-label="Keyboard shortcuts"
								>
									Keyboard controls
									<InfoIcon class="size-3.5" />
								</Tooltip.Trigger>
								<Tooltip.Portal>
									<Tooltip.Content
										arrowClasses="bg-popover"
										class="grid max-w-sm min-w-72 grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5 border border-border bg-popover p-4 text-popover-foreground shadow-md [&_kbd]:rounded-sm [&_kbd]:border [&_kbd]:border-border [&_kbd]:bg-muted [&_kbd]:px-1.5 [&_kbd]:py-0.5 [&_kbd]:font-mono [&_kbd]:text-[0.65rem] [&_kbd]:font-medium [&_kbd]:text-foreground"
									>
										<span class="flex justify-end gap-1.5"><kbd>←</kbd>/<kbd>→</kbd></span>
										<span>switch between A and B</span>
										<span class="flex justify-end gap-1.5"><kbd>↑</kbd>/<kbd>↓</kbd></span>
										<span>increase or decrease volume</span>
										<span class="flex justify-end"><kbd>N</kbd></span>
										<span>select neither option</span>
										<span class="flex justify-end gap-1.5"><kbd>Space</kbd>/<kbd>Enter</kbd></span>
										<span>confirm your selection</span>
									</Tooltip.Content>
								</Tooltip.Portal>
							</Tooltip.Root>
						</Tooltip.Provider>
					{/if}
					<button
						type="button"
						class={cn(
							'w-full rounded-lg px-6 py-3 text-sm font-medium transition-all',
							selection
								? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
								: 'cursor-not-allowed bg-muted text-muted-foreground'
						)}
						onclick={handleConfirm}
						disabled={!selection || confirmed}
						aria-label="Confirm selection"
					>
						{confirmed
							? 'Confirmed!'
							: selection
								? `Confirm: ${selection === 'neither' ? 'Neither' : selection.toUpperCase()}`
								: 'Select A, B, or Neither'}
					</button>
				</div>
			</div>
		</div>

		<!-- Keyboard-mode overlay: hides cursor and blocks hover until mouse moves -->
		{#if keyboardMode}
			<div
				class="pointer-events-auto absolute inset-0 cursor-none"
				aria-hidden="true"
				onmousemove={handleMouseMove}
			/>
		{/if}
	{/if}
</div>
