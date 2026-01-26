<script lang="ts">
	import { setSlotContext } from '#lib/utils/slot-context-helper.svelte.js';
	import { type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { SectionContent } from './index.js';

	type SectionProps = HTMLAttributes<HTMLElement>;

	let {
		children,
		class: className,
		...restProps
	}: { children: Snippet; class?: string } & SectionProps = $props();

	const slots = setSlotContext<'background' | 'content'>('section');
</script>

<section class="relative flex flex-col items-center py-4 {className}" {...restProps}>
	{@render slots.background?.()}

	{@render slots.content?.()}

	{#if !slots.content}
		<SectionContent>
			{@render children?.()}
		</SectionContent>
	{/if}

	<div class="hidden">
		{@render children?.()}
	</div>
</section>

<style lang="scss">
	:global(header + main > section) {
		@apply first:pt-(--header-height);
	}
</style>
