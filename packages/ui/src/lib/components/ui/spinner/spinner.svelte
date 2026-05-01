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

	@property --spinner-front {
		syntax: '<number>';
		inherits: false;
		initial-value: 12.5;
	}

	@property --spinner-back {
		syntax: '<number>';
		inherits: false;
		initial-value: 0;
	}

	.windows-spinner__arc {
		--spinner-front: 12.5;
		--spinner-back: 0;
		animation:
			windows-spinner-front var(--spinner-duration) ease-in-out infinite,
			windows-spinner-back var(--spinner-duration) linear infinite;
		stroke: currentColor;
		stroke-dasharray: calc(var(--spinner-front) - var(--spinner-back))
			calc(100 - (var(--spinner-front) - var(--spinner-back)));
		stroke-dashoffset: calc(var(--spinner-back) * -1);
		transform-box: fill-box;
		transform-origin: center;
	}

	@keyframes windows-spinner-front {
		from {
			--spinner-front: 12.5;
		}
		to {
			--spinner-front: 112.5;
		}
	}

	@keyframes windows-spinner-back {
		0%,
		25% {
			--spinner-back: 0;
			animation-timing-function: ease-in-out;
		}
		100% {
			--spinner-back: 100;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.windows-spinner__arc {
			animation: none;
			stroke-dasharray: 62 38;
		}
	}
</style>
