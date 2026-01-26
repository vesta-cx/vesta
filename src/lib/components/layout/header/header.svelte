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

	let heroVisible = $state(false);

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
				{threshold: 0.1 }
			)

			observer.observe(hero);
			return () => observer.disconnect();
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
			flex-row flex justify-between 
			gap-6 p-4 mt-2
			text-card-foreground
			rounded-xl
			overflow-clip
			transition-[background-color,color,border-width,border-color,box-shadow,margin-top]
			ease-out
			duration-300
			{!heroVisible ? 'bg-card text-card-foreground border border-border shadow-sm mt-4' : 'border border-border/0'}
		"
	>
		{@render children()}
		<div
			data-component="scroll-progress"
			class="absolute right-0 bottom-0 left-0 h-px bg-border/50"
		></div>
		<div
			data-component="scroll-progress"
			class="absolute right-(--right) bottom-0 left-0 h-px bg-primary"
		></div>
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
