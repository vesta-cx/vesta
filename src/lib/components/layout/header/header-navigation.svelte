<script lang="ts">
	import { getSlotContext } from '#lib/utils/slot-context-helper.svelte.js';
	import type { Snippet } from 'svelte';

	const ctx = getSlotContext<'nav'>('header');

	$effect(() => {
		if (ctx && nav) {
			ctx.register('nav', nav);
		}
	});

	let { children, class: className }: { children: Snippet; class?: string } = $props();
</script>

{#snippet nav()}
	<nav class={className} data-slot="header-nav">
		{@render children?.()}
	</nav>
{/snippet}
