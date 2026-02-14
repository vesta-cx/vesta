<script lang="ts">
	import { getSlotContext } from '#lib/utils/slot-context-helper.svelte.js';
	import type { Snippet } from 'svelte';

	const ctx = getSlotContext<'actions'>('header');

	$effect(() => {
		if (ctx && actions) {
			ctx.register('actions', actions);
		}
	});

	let { children }: { children: Snippet } = $props();
</script>

{#snippet actions()}
	{@render children?.()}
{/snippet}
