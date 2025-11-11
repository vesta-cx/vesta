<script lang="ts">
	import { getContext, onMount, type Snippet } from 'svelte';

	export interface SectionBackgroundContext {
		register: (snippet: Snippet) => void;
	}

	let { children, class: className }: { children: Snippet; class?: string } = $props();

	const ctx = getContext<SectionBackgroundContext | undefined>('section-background');

	$effect(() => {
		// Register the background snippet with the context
		if (ctx && background) {
			ctx.register(background);
		}
	});
</script>

<!-- Hero Background Component (in a snippet so it can be registered with the context) -->
{#snippet background()}
	<figure class="absolute inset-0 -z-10 {className}" data-slot="section-background">
		{@render children()}
		<!-- If browser supports backdrop-filter, add a background color to the hero background -->
		<div
			class="absolute inset-0 bg-background/75 supports-backdrop-filter:bg-background/50 supports-backdrop-filter:backdrop-blur"
		></div>
	</figure>
{/snippet}
