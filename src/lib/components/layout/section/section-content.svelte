<script lang="ts">
	import { getSlotContext } from '#lib/utils/slot-context-helper.svelte.js';
	import { type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	type SectionContentProps = HTMLAttributes<HTMLDivElement>;

	let {
		children,
		class: className,
		...restProps
	}: { children: Snippet } & SectionContentProps = $props();

	const ctx = getSlotContext<'content'>('section');

	if (ctx && content) {
		ctx.register('content', content);
	}
</script>

{#snippet content()}
	<div
		class="container rounded-none p-4 transition-[border-radius] duration-300 ease-out sm:rounded-2xl {className}"
		data-slot="section-content"
		{...restProps}
	>
		{@render children()}
	</div>
{/snippet}

{#if !ctx}
	{@render content()}
{/if}
