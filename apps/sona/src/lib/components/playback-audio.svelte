<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		token: string;
		startSeconds: number;
		/** Preloaded blob URL for opus_128; avoids fetch gap when coming from answer submit */
		preloadedBlobUrl?: string | null;
	}

	let { token, startSeconds, preloadedBlobUrl = null }: Props = $props();

	let audioEl: HTMLAudioElement | null = null;
	let audioCtx: AudioContext | null = null;
	let sourceNode: MediaElementAudioSourceNode | null = null;
	let gainNode: GainNode | null = null;
	let blobUrl: string | null = null;

	const FADE_MS = 250;

	const fadeOut = (): Promise<void> => {
		return new Promise((resolve) => {
			if (!audioCtx || !gainNode || !audioEl) {
				resolve();
				return;
			}
			const now = audioCtx.currentTime;
			gainNode.gain.setValueAtTime(gainNode.gain.value, now);
			gainNode.gain.linearRampToValueAtTime(0, now + FADE_MS / 1000);
			setTimeout(() => {
				audioEl?.pause();
				audioCtx?.close();
				audioCtx = null;
				sourceNode = null;
				gainNode = null;
				if (blobUrl) {
					URL.revokeObjectURL(blobUrl);
					blobUrl = null;
				}
				resolve();
			}, FADE_MS);
		});
	};

	onMount(async () => {
		if (typeof window === 'undefined') return;

		try {
			if (preloadedBlobUrl) {
				blobUrl = preloadedBlobUrl;
			} else {
				const res = await fetch(`/api/stream/${token}`);
				if (!res.ok) return;

				const blob = await res.blob();
				blobUrl = URL.createObjectURL(blob);
			}

			audioEl = new Audio(blobUrl);

			let started = false;
			const onCanPlay = () => {
				if (!audioEl || started) return;
				started = true;

				audioEl.currentTime = startSeconds;
				if (!audioCtx) {
					try {
						audioCtx = new AudioContext();
						sourceNode = audioCtx.createMediaElementSource(audioEl);
						gainNode = audioCtx.createGain();
						gainNode.gain.value = 1;
						sourceNode.connect(gainNode);
						gainNode.connect(audioCtx.destination);
					} catch {
						// Fallback: no Web Audio
					}
				}
				// Resume if suspended (autoplay policy)
				if (audioCtx?.state === 'suspended') {
					audioCtx.resume();
				}
				audioEl.play().catch(() => {});
			};

			audioEl.oncanplay = onCanPlay;

			// Already buffered enough?
			if (audioEl.readyState >= 2) {
				onCanPlay();
			}
		} catch {
			// Load failed
		}

		return () => {
			audioEl?.pause();
			audioCtx?.close();
			if (blobUrl) URL.revokeObjectURL(blobUrl);
		};
	});

	export { fadeOut };
</script>

<!-- Headless: audio created in onMount, plays from blob URL to avoid stream seeking/rebuffering glitches -->
<div class="hidden" aria-hidden="true"></div>
