<script lang="ts">
	import { getContext, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	export interface SectionContentContext {
		register: (snippet: Snippet) => void;
	}

	type SectionContentProps = HTMLAttributes<HTMLDivElement>;

	let {
		children,
		class: className,
		...restProps
	}: { children: Snippet } & SectionContentProps = $props();

	const ctx = getContext<SectionContentContext | undefined>('section-content');

	if (ctx && content) {
		ctx.register(content);
	}
</script>

{#snippet content()}
	<div class="container p-4 {className}" data-slot="section-content" {...restProps}>
		{@render children()}
	</div>
{/snippet}

{#if !ctx}
	{@render content()}
{/if}