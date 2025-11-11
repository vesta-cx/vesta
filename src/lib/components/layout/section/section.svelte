<script lang="ts">
	import { setContext, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { SectionContent } from './index.js';

	type SectionProps = HTMLAttributes<HTMLElement>;

	let {
		children,
		class: className,
		...restProps
	}: { children: Snippet; class?: string } & SectionProps = $props();

	let background: Snippet | undefined = $state(undefined);
	let content: Snippet | undefined = $state(undefined);

	// Create context for HeroBackground to register itself
	setContext('section-background', {
		register: (snippet: Snippet) => {
			background = snippet;
		}
	});
	// Create context for HeroContent to register itself
	setContext('section-content', {
		register: (snippet: Snippet) => {
			content = snippet;
		}
	});
</script>

<section class="relative flex flex-col items-center py-4 {className}" {...restProps}>
	{@render background?.()}

	{@render content?.()}

	{#if !content}
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
