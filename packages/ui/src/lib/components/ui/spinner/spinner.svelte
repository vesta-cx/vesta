<script lang="ts">
	import { cn } from '$lib/utils.js';
	import type { SVGAttributes } from 'svelte/elements';

	let {
		class: className,
		'aria-label': ariaLabel = 'Loading',
		...restProps
	}: SVGAttributes<SVGSVGElement> & { class?: string } = $props();
</script>

<svg
	role="status"
	aria-label={ariaLabel}
	viewBox="0 0 24 24"
	class={cn('windows-spinner size-4', className)}
	{...restProps}
>
	<circle class="windows-spinner__track" cx="12" cy="12" r="9" />
	<circle class="windows-spinner__arc" cx="12" cy="12" r="9" pathLength="100" />
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
		animation: windows-spinner-dash var(--spinner-duration) ease-in-out infinite;
		stroke: currentColor;
		stroke-dasharray: 12.5 87.5;
		stroke-dashoffset: 0;
		transform-box: fill-box;
		transform-origin: center;
	}

	@keyframes windows-spinner-dash {
		0% {
			stroke-dasharray: 12.5 87.5;
			stroke-dashoffset: 0;
		}
		50% {
			stroke-dasharray: 87.5 12.5;
			stroke-dashoffset: 0;
		}
		100% {
			stroke-dasharray: 12.5 87.5;
			stroke-dashoffset: -100;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.windows-spinner__arc {
			animation: none;
			stroke-dasharray: 62 38;
		}
	}
</style>
