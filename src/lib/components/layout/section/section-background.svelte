<script lang="ts">
	import { getSlotContext } from '#lib/utils/slot-context-helper.svelte.js';
	import { type Snippet } from 'svelte';

	let { children, class: className }: { children: Snippet; class?: string } = $props();

	const ctx = getSlotContext<'background'>('section');

	$effect(() => {
		// Register the background snippet with the context
		if (ctx && background) {
			ctx.register('background',background);
		}
	});
</script>

<!-- Hero Background Component (in a snippet so it can be registered with the context) -->
{#snippet background()}
	<figure class="absolute inset-0 -z-10 {className}" data-slot="section-background">
		{@render children()}
	</figure>
{/snippet}
