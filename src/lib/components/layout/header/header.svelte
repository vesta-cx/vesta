<script lang="ts">
	import { setSlotContext } from '#lib/utils/slot-context-helper.svelte.js';
	import { EasedGradient } from '@/utils/eased-gradient/index.js';
	import { GradientBlur } from '@/utils/gradient-blur/index.js';
	import { easeOutQuad } from '@vesta-cx/utils';
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	type HeaderProps = { children: Snippet } & HTMLAttributes<HTMLElement>;

	let { children, class: className, ...restProps }: HeaderProps = $props();

	let heroVisible = $state(true);

	onMount(() => {
		// set css var --header-height on :root to the height of the header
		const header = document.querySelector('header');
		const hero = document.querySelector('header + main section[data-section="hero"]');
		if (header) {
			document.documentElement.style.setProperty('--header-height', `${header.clientHeight}px`);
		}

		if (hero) {
			const observer = new IntersectionObserver(
				([entry]) => {
					heroVisible = entry.isIntersecting;
				},
				{ threshold: 0.1 }
			);

			observer.observe(hero);
			return () => observer.disconnect();
		} else {
			heroVisible = false;
		}
	});

	const slots = setSlotContext<'logo' | 'nav'>('header');
</script>

<header
	id="header"
	data-hero-visible={heroVisible}
	class="fixed top-0 flex w-full items-center justify-center {className}"
	{...restProps}
>
	<GradientBlur
		data-section="header-background"
		class="bottom-(--bottom)"
		blur={12}
		detail={8}
		mask={{ type: 'linear', angle: 'to top' }}
	/>

	<EasedGradient
		class="absolute inset-0 bottom-(--bottom)"
		data-section="header-background"
		detail={8}
		easeFunction={easeOutQuad}
		gradient={{
			type: 'linear',
			angle: 'to bottom',
			stops: ['var(--background) 0%', 'transparent 100%']
		}}
	/>

	<div
		class="
			relative z-10 container
			flex flex-row
			justify-between gap-6 overflow-clip
			sm:rounded-2xl rounded-none
			max-sm:pt-6 p-4 sm:mt-2
			text-card-foreground
			transition-[background-color,color,border-width,border-color,box-shadow,margin,padding,width,height,border-radius]
			duration-300
			ease-out
			{!heroVisible
			? 'sm:mt-4 sm:border border-border bg-card text-card-foreground shadow-sm'
			: 'sm:border border-border/0'}
		"
	>
		{#if slots.logo}
			{@render slots.logo?.()}
		{/if}
		{#if slots.nav}
			{@render slots.nav?.()}
		{/if}
		<div class="absolute right-0 bottom-0 left-0 h-px bg-border"></div>
		<div
			data-component="scroll-progress"
			class="absolute right-(--right) bottom-0 left-0 h-px bg-primary/50"
		></div>
	</div>
	<div class="hidden">
		{@render children?.()}
	</div>
</header>

<style lang="scss">
	@property --top {
		syntax: '<length-percentage>';
		initial-value: 0%;
		inherits: false;
	}

	@property --right {
		syntax: '<length-percentage>';
		initial-value: 0%;
		inherits: false;
	}

	@property --bottom {
		syntax: '<length-percentage>';
		initial-value: 0%;
		inherits: false;
	}

	@property --left {
		syntax: '<length-percentage>';
		initial-value: 0%;
		inherits: false;
	}

	@keyframes scroll-progress {
		from {
			--right: 100%;
		}
		to {
			--right: 0%;
		}
	}

	header [data-component='scroll-progress'] {
		animation: scroll-progress linear;
		animation-timeline: scroll();
	}

	:global {
		@keyframes header-scroll {
			from {
				--bottom: -500%;
			}
			to {
				--bottom: -200%;
			}
		}

		:root {
			timeline-scope: --hero-timeline;
		}

		header + main section:first-of-type {
			@apply first:pt-(--header-height);

			&[data-section='hero'] {
				view-timeline-name: --hero-timeline;
			}
		}

		header {
			[data-section='header-background'] {
				animation: header-scroll linear both;
				animation-timeline: --hero-timeline;
				animation-range: exit 0% 90%;
			}
		}
	}
</style>
