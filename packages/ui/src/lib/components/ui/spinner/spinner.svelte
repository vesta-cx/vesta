<script lang="ts">
	import { onMount } from 'svelte';
	import { cn } from '$lib/utils.js';
	import type { SVGAttributes } from 'svelte/elements';

	let {
		class: className,
		'aria-label': ariaLabel = 'Loading',
		...restProps
	}: SVGAttributes<SVGSVGElement> & { class?: string } = $props();

	let spinnerElement: SVGSVGElement;
	let arcElement: SVGCircleElement;

	const HEAD_START = 12.5;
	const TAIL_START_DELAY = 0.28;
	const DEFAULT_DURATION_MS = 1800;

	const easeInOut = (value: number): number => 0.5 - Math.cos(Math.PI * value) / 2;

	const parseDuration = (value: string): number => {
		const trimmed = value.trim();
		if (trimmed.endsWith('ms')) return Number.parseFloat(trimmed);
		if (trimmed.endsWith('s')) return Number.parseFloat(trimmed) * 1000;
		return Number.parseFloat(trimmed) || DEFAULT_DURATION_MS;
	};

	onMount(() => {
		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
		if (reduceMotion.matches) return;

		const duration = parseDuration(
			getComputedStyle(spinnerElement).getPropertyValue('--spinner-duration')
		);
		let frame = 0;
		let startedAt: number | null = null;

		const animate = (timestamp: number) => {
			startedAt ??= timestamp;
			const progress = ((timestamp - startedAt) % duration) / duration;
			const tailCycle = progress - TAIL_START_DELAY;
			const tailIteration = Math.floor(tailCycle);
			const tailProgress = tailCycle - tailIteration;
			const head = HEAD_START + 100 * easeInOut(progress);
			const tail = 100 * (tailIteration + easeInOut(tailProgress));
			const length = head - tail;

			arcElement.style.strokeDasharray = `${length} ${100 - length}`;
			arcElement.style.strokeDashoffset = String(-tail);
			frame = window.requestAnimationFrame(animate);
		};

		frame = window.requestAnimationFrame(animate);
		return () => window.cancelAnimationFrame(frame);
	});
</script>

<svg
	bind:this={spinnerElement}
	role="status"
	aria-label={ariaLabel}
	viewBox="0 0 24 24"
	class={cn('windows-spinner size-4', className)}
	{...restProps}
>
	<circle class="windows-spinner__track" cx="12" cy="12" r="9" />
	<circle
		bind:this={arcElement}
		class="windows-spinner__arc"
		cx="12"
		cy="12"
		r="9"
		pathLength="100"
	/>
</svg>

<style>
	.windows-spinner {
		--spinner-duration: 1.8s;
		overflow: visible;
	}

	.windows-spinner__track,
	.windows-spinner__arc {
		fill: none;
		stroke-width: 2.25;
		stroke-linecap: round;
	}

	.windows-spinner__track {
		stroke: currentColor;
		opacity: 0.16;
	}

	.windows-spinner__arc {
		stroke: currentColor;
		stroke-dasharray: 12.5 87.5;
		stroke-dashoffset: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		.windows-spinner__arc {
			stroke-dasharray: 62 38;
		}
	}
</style>
