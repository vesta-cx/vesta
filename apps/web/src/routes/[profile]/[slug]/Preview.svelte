<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';

	let { url, duration }: { url: string; duration: number } = $props();
	let audio: HTMLAudioElement;
	let ready = $state(false);
	let playing = $state(false);
	let elapsed = $state(0);
	let failed = $state(false);

	onMount(() => {
		ready = true;
	});

	function timestamp(seconds: number) {
		const time = Math.floor(seconds);
		return `${Math.floor(time / 60)}:${String(time % 60).padStart(2, '0')}`;
	}

	async function togglePlayback() {
		if (!audio.paused) {
			audio.pause();
			return;
		}

		if (!audio.getAttribute('src')) audio.src = `${base}/${url}`;
		if (failed) audio.load();
		failed = false;
		try {
			await audio.play();
		} catch (error) {
			if (!(error instanceof DOMException && error.name === 'AbortError')) failed = true;
		}
	}
</script>

<div class="preview">
	<audio
		bind:this={audio}
		preload="none"
		onplaying={() => (playing = true)}
		onpause={() => (playing = false)}
		onended={() => {
			playing = false;
			audio.currentTime = 0;
		}}
		ontimeupdate={() => (elapsed = audio.currentTime)}
		onerror={() => {
			playing = false;
			failed = true;
		}}
	></audio>
	<button class="preview-button" type="button" disabled={!ready} onclick={togglePlayback}>
		<svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
			{#if playing}
				<path d="M4 2h3v12H4zm5 0h3v12H9z" />
			{:else}
				<path d="M4 2v12l10-6z" />
			{/if}
		</svg>
		{playing ? 'Pause preview' : 'Play preview'}
	</button>
	<span class="preview-time blog-meta">
		<span class="sr-only">Preview time:</span>
		{timestamp(elapsed)} / {timestamp(duration)}
	</span>
	{#if failed}
		<p role="status" class="blog-meta basis-full">Couldn’t play the preview. Try again.</p>
	{/if}
</div>

<style>
	.preview {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.preview-button {
		display: inline-flex;
		align-items: center;
		gap: 0.625rem;
		min-height: 3rem;
		min-width: 12rem;
		padding: 0.75rem 1rem;
		border-radius: 0.125rem;
		background: var(--accent);
		color: var(--paper);
		font-size: 0.9375rem;
		font-weight: 650;
		cursor: pointer;
	}

	.preview-button:enabled:hover {
		background: var(--accent-hover);
	}

	.preview-button:disabled {
		cursor: default;
	}

	.preview-time {
		font-variant-numeric: tabular-nums;
	}
</style>
