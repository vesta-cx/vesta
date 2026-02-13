<script lang="ts">
	import { cn } from '$lib/utils.js';
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';

	type AnchorProps = HTMLAnchorAttributes & {
		children: Snippet;
		/** Show directional icon after link text. Defaults to `true`. */
		showIcon?: boolean;
		class?: string;
	};

	let {
		children,
		href,
		showIcon = true,
		class: className,
		target,
		rel,
		...restProps
	}: AnchorProps = $props();

	const isExternal = $derived(
		!!href &&
			(href.startsWith('http://') ||
				href.startsWith('https://') ||
				href.startsWith('mailto:') ||
				href.startsWith('tel:'))
	);

	const resolvedTarget = $derived(target ?? (isExternal ? '_blank' : undefined));
	const resolvedRel = $derived(
		rel ?? (resolvedTarget === '_blank' ? 'noopener noreferrer' : undefined)
	);
</script>

<a
	{href}
	target={resolvedTarget}
	rel={resolvedRel}
	class={cn('group inline-flex items-center gap-1', className)}
	{...restProps}
>
	{@render children()}
	{#if showIcon}
		{#if isExternal}
			<ArrowUpRightIcon
				class="size-[1em] shrink-0 opacity-50 transition-opacity group-hover:opacity-100"
			/>
		{:else}
			<ArrowRightIcon
				class="size-[1em] shrink-0 translate-x-0 translate-y-[5%] opacity-50 transition-[opacity,translate] group-hover:translate-x-0.5 group-hover:opacity-100"
			/>
		{/if}
	{/if}
</a>
