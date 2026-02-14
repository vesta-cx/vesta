<script lang="ts">
	import { setSlotContext } from '#lib/utils/slot-context-helper.svelte.js';
	import { EasedGradient } from '#lib/components/utils/eased-gradient/index.js';
	import { GradientBlur } from '#lib/components/utils/gradient-blur/index.js';
	import { easeOutQuad } from '@vesta-cx/utils';
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	type HeaderProps = { children: Snippet } & HTMLAttributes<HTMLElement>;

	let { children, class: className, ...restProps }: HeaderProps = $props();

	let heroVisible = $state(true);
	let heroIntersectionRatio = $state(1);

	onMount(() => {
		// set css var --header-height on :root to the height of the header
		const header = document.querySelector('header');
		const hero = document.querySelector('header + main section[data-section="hero"]');

		// console.group('[Header] IntersectionObserver setup');
		// console.log('header element:', header);
		// console.log('hero selector: header + main section[data-section="hero"]');
		// console.log('hero element:', hero);

		// Debug: check what sections exist in the DOM
		// const allSections = document.querySelectorAll('section');
		// const heroSections = document.querySelectorAll('[data-section="hero"]');
		// const mainEl = document.querySelector('header + main');
		// console.log('header + main:', mainEl);
		// console.log('all <section> elements:', allSections.length, [...allSections].map(s => ({ tag: s.tagName, dataSection: s.getAttribute('data-section'), parent: s.parentElement?.tagName })));
		// console.log('[data-section="hero"] elements:', heroSections.length, [...heroSections].map(s => ({ tag: s.tagName, parent: s.parentElement?.tagName, grandparent: s.parentElement?.parentElement?.tagName })));
		// console.groupEnd();

		if (header) {
			document.documentElement.style.setProperty('--header-height', `${header.clientHeight}px`);
		}

		if (hero) {
			const supportsViewTimeline = CSS.supports(
						'(view-timeline: --hero-timeline) and (animation-timeline: --hero-timeline) and (animation-range: exit 0% 90%) and (timeline-scope: --hero-timeline)'
					);
			// console.log('[Header] supportsViewTimeline:', supportsViewTimeline);
			let observer: IntersectionObserver | null = null;

			if (!supportsViewTimeline) {
				observer = new IntersectionObserver(
					([entry]) => {
						heroIntersectionRatio = 1-(Math.max(entry.intersectionRatio, 0.1) - 0.1) / 9 * 10;
						header?.style.setProperty('--hero-intersection-ratio', `${(-5 + heroIntersectionRatio * 3) *100}%`);
						heroVisible = heroIntersectionRatio < 0.9;
						// console.log('[Header] IO (fallback):', { intersectionRatio: entry.intersectionRatio, heroIntersectionRatio, heroVisible });
					},
					{ threshold: Array.from({ length: 50 }, (_, i) => i / 50) }
				);
			} else {
				observer = new IntersectionObserver(
					([entry]) => {
						heroVisible = entry.isIntersecting;
						// console.log(`[Header] IO (view-timeline): isIntersecting=${entry.isIntersecting}, ratio=${entry.intersectionRatio.toFixed(3)}, heroVisible=${heroVisible}`);
					},
					{ threshold: 0.1 }
				);
			}

			observer.observe(hero);
			// console.log(`[Header] Observer started. heroVisible=${heroVisible} (should be true at page load)`);
			return () => observer.disconnect();
		} else {
			// console.warn('[Header] No hero section found — falling back to card style (heroVisible = false)');
			heroVisible = false;
		}
	});

	const slots = setSlotContext<'logo' | 'nav' | 'actions'>('header');
</script>

<header
	id="header"
	data-hero-visible={heroVisible}
	class="fixed top-0 left-0 right-0 z-10 flex w-full items-center justify-center [transform:translateZ(0)] [backface-visibility:hidden] [-webkit-backface-visibility:hidden] {className}"
	{...restProps}
>
	<GradientBlur
		data-section="header-background"
		class="bottom-(--hero-intersection-ratio,var(--bottom)) -z-20"
		blur={12}
		detail={8}
		mask={{ type: 'linear', angle: 'to top' }}
	/>

	<EasedGradient
		class="absolute inset-0 bottom-(--hero-intersection-ratio,var(--bottom))"
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
			flex flex-row items-center
			justify-between gap-6 overflow-clip
			rounded-none p-4
			text-card-foreground transition-[background-color,color,border-width,border-color,box-shadow,margin,padding,width,height,border-radius] duration-300
			ease-out
			max-sm:pt-6
			sm:mt-2
			sm:rounded-2xl
			{!heroVisible
			? 'border-border bg-card/50 text-card-foreground shadow-sm backdrop-blur-sm sm:mt-4 sm:border'
			: 'border-border/0 sm:border'}
		"
	>
		{#if slots.logo}
			{@render slots.logo?.()}
		{/if}
		{#if slots.nav}
			<div class="flex flex-1 justify-center min-w-0">{@render slots.nav?.()}</div>
		{/if}
		{#if slots.actions}
			<div class="flex items-center gap-2 shrink-0" data-slot="header-actions">
				{@render slots.actions?.()}
			</div>
		{/if}
		<div class="absolute right-0 bottom-0 left-0 h-px bg-border"></div>
		<div
			data-section="header-scroll-progress"
			class="absolute right-(--right) bottom-0 left-0 h-px bg-primary/50"
		></div>
	</div>
	<div class="hidden">
		{@render children?.()}
	</div>
</header>

<style lang="scss">
	:global {
		header + main section:first-of-type {
			padding-top: calc(var(--header-height) + 2rem);
		}
	}

	@supports (view-timeline: --hero-timeline) and (animation-timeline: --hero-timeline) and
		(animation-range: exit 0% 90%) and (timeline-scope: --hero-timeline) {
		:root {
			timeline-scope: --hero-timeline;
		}

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
		header {
			@keyframes scroll-progress {
				from {
					--right: 100%;
				}
				to {
					--right: 0%;
				}
			}

			[data-section='header-scroll-progress'] {
				animation: scroll-progress linear;
				animation-timeline: scroll();
				transition: right 0.2s ease-out;
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

				+ main section:first-of-type {
					&[data-section='hero'] {
						view-timeline-name: --hero-timeline;
					}
				}

				[data-section='header-background'] {
					animation: header-scroll linear both;
					animation-timeline: --hero-timeline;
					animation-range: exit 0% 90%;
				}
			}
		}
	}
</style>
