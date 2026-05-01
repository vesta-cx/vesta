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

	@property --spinner-length {
		syntax: '<number>';
		inherits: false;
		initial-value: 12.5;
	}

	@property --spinner-offset {
		syntax: '<number>';
		inherits: false;
		initial-value: 0;
	}

	.windows-spinner__arc {
		--spinner-length: 12.5;
		--spinner-offset: 0;
		animation:
			windows-spinner-length var(--spinner-duration) linear infinite,
			windows-spinner-offset var(--spinner-duration) linear infinite;
		stroke: currentColor;
		stroke-dasharray: var(--spinner-length) calc(100 - var(--spinner-length));
		stroke-dashoffset: var(--spinner-offset);
		transform-box: fill-box;
		transform-origin: center;
	}

	@keyframes windows-spinner-length {
		0% {
			animation-timing-function: ease-in-out;
			--spinner-length: 12.5;
		}
		50% {
			animation-timing-function: ease-in-out;
			--spinner-length: 87.5;
		}
		100% {
			--spinner-length: 12.5;
		}
	}

	@keyframes windows-spinner-offset {
		0%,
		50% {
			animation-timing-function: ease-in-out;
			--spinner-offset: 0;
		}
		100% {
			--spinner-offset: -100;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.windows-spinner__arc {
			animation: none;
			stroke-dasharray: 62 38;
		}
	}
</style>
