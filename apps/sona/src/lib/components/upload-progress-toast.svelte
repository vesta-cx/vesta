<script lang="ts">
	import { uploadProgress } from '$lib/stores/upload-progress';

	const state = $derived($uploadProgress);
	const message = $derived.by(() => {
		if (!state) return '';
		if (state.type === 'uploading') {
			if ('current' in state && 'total' in state)
				return `Uploading ${state.current}/${state.total}…`;
			return `Uploading… ${state.pct}%`;
		}
		if (state.type === 'transcoding') {
			if ('current' in state && 'total' in state)
				return `Transcoding ${state.current}/${state.total}…`;
			return 'Transcoding…';
		}
		if (state.type === 'complete') return 'Done!';
		return '';
	});
	const pct = $derived.by(() => {
		if (!state) return 0;
		if (state.type === 'complete') return 100;
		if (state.type === 'uploading') {
			if ('current' in state && 'total' in state && state.total > 0)
				return Math.round((state.current / state.total) * 100);
			return 'pct' in state ? state.pct : 50;
		}
		if (state.type === 'transcoding' && 'current' in state && 'total' in state && state.total > 0)
			return Math.round((state.current / state.total) * 100);
		return 50;
	});
	const isIndeterminate = $derived(
		state?.type === 'transcoding' &&
			(!('current' in state) || !('total' in state) || state.total <= 1)
	);
</script>

<div class="card flex min-w-64 flex-col gap-2">
	<p class="text-sm font-medium">
		{message}
	</p>
	<div class="h-1.5 w-full overflow-hidden rounded-full bg-muted">
		{#if isIndeterminate}
			<div class="h-full animate-pulse rounded-full bg-primary" style="width: 100%"></div>
		{:else}
			<div
				class="h-full rounded-full bg-primary transition-[width] duration-150 ease-out"
				style="width: {pct}%"
			></div>
		{/if}
	</div>
</div>
