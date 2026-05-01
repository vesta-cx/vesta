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
		animation:
			windows-spinner-dash var(--spinner-duration) cubic-bezier(0.35, 0, 0.25, 1) infinite,
			windows-spinner-rotate var(--spinner-duration) linear infinite;
		stroke: currentColor;
		stroke-dasharray: 1 99;
		stroke-dashoffset: 0;
		transform-box: fill-box;
		transform-origin: center;
	}

	@keyframes windows-spinner-dash {
		0% {
			stroke-dasharray: 1 99;
			stroke-dashoffset: 0;
		}
		42% {
			stroke-dasharray: 76 24;
			stroke-dashoffset: 0;
		}
		78% {
			stroke-dasharray: 1 99;
			stroke-dashoffset: -76;
		}
		100% {
			stroke-dasharray: 1 99;
			stroke-dashoffset: -100;
		}
	}

	@keyframes windows-spinner-rotate {
		0%,
		38% {
			transform: rotate(0deg);
		}
		78%,
		100% {
			transform: rotate(360deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.windows-spinner__arc {
			animation: none;
			stroke-dasharray: 62 38;
		}
	}
</style>
