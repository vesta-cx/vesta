<script lang="ts">
	import { Card } from '@/ui/card/index.js';
	import { GradientBlur } from '@/utils/gradient-blur/index.js';
	import { onMount, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	type HeaderProps = { children: Snippet } & HTMLAttributes<HTMLElement>;

	let { children, class: className, ...restProps }: HeaderProps = $props();

	onMount(() => {
		// set css var --header-height on :root to the height of the header
		const header = document.querySelector('header');
		if (header) {
			document.documentElement.style.setProperty('--header-height', `${header.clientHeight}px`);
		}
	});
</script>

<header
	id="header"
	class="fixed top-0 z-50 flex w-full items-center justify-center {className}"
	{...restProps}
>
	<GradientBlur
		class="-inset-12"
		blur={24}
		detail={8}
		mask={{ gradient: 'linear', angle: 'to top' }}
	/>
	<Card
		class="relative container my-4 bg-card/95 p-4 supports-backdrop-filter:bg-card/50 supports-backdrop-filter:backdrop-blur-xl"
	>
		{@render children()}
	</Card>
</header>
