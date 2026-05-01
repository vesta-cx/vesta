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

	@property --spinner-head {
		syntax: '<number>';
		inherits: false;
		initial-value: 12.5;
	}

	@property --spinner-tail {
		syntax: '<number>';
		inherits: false;
		initial-value: 0;
	}

	.windows-spinner__arc {
		--spinner-head: 12.5;
		--spinner-tail: 0;
		animation:
			windows-spinner-head var(--spinner-duration) linear infinite,
			windows-spinner-tail var(--spinner-duration) linear infinite;
		stroke: currentColor;
		stroke-dasharray: calc(var(--spinner-head) - var(--spinner-tail))
			calc(100 - (var(--spinner-head) - var(--spinner-tail)));
		stroke-dashoffset: calc(var(--spinner-tail) * -1);
	}

	@keyframes windows-spinner-head {
		0% {
			animation-timing-function: ease-in-out;
			--spinner-head: 12.5;
		}
		12.5%,
		25% {
			--spinner-head: 87.5;
		}
		25% {
			animation-timing-function: ease-in-out;
		}
		37.5%,
		50% {
			--spinner-head: 162.5;
		}
		50% {
			animation-timing-function: ease-in-out;
		}
		62.5%,
		75% {
			--spinner-head: 237.5;
		}
		75% {
			animation-timing-function: ease-in-out;
		}
		87.5%,
		100% {
			--spinner-head: 312.5;
		}
	}

	@keyframes windows-spinner-tail {
		0%,
		12.5% {
			--spinner-tail: 0;
		}
		12.5% {
			animation-timing-function: ease-in-out;
		}
		25%,
		37.5% {
			--spinner-tail: 75;
		}
		37.5% {
			animation-timing-function: ease-in-out;
		}
		50%,
		62.5% {
			--spinner-tail: 150;
		}
		62.5% {
			animation-timing-function: ease-in-out;
		}
		75%,
		87.5% {
			--spinner-tail: 225;
		}
		87.5% {
			animation-timing-function: ease-in-out;
		}
		100% {
			--spinner-tail: 300;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.windows-spinner__arc {
			animation: none;
			stroke-dasharray: 62 38;
			stroke-dashoffset: 0;
		}
	}
</style>
