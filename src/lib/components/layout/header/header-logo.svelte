<script lang="ts">
	import { getSlotContext } from '#lib/utils/slot-context-helper.svelte.js';
	import type { Snippet } from 'svelte';

    const ctx = getSlotContext<'logo'>('header');

    $effect(() => {
        if (ctx && logo) {
            ctx.register('logo', logo);
        }
    });

    let { children, class: className }: { children: Snippet; class?: string } = $props();
</script>

<!-- Hero Background Component (in a snippet so it can be registered with the context) -->
{#snippet logo()}
	<figure class="{className}" data-slot="header-logo">
		{@render children()}
	</figure>
{/snippet}
