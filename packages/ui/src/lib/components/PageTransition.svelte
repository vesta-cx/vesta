<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import type { TransitionFunction } from '$lib/types/svelte-transition.js';
	import split_css_unit from '$lib/util/split_css_unit.js';
	import { type Snippet } from 'svelte';
	import { cubicIn, cubicInOut, cubicOut } from 'svelte/easing';
	import { type EasingFunction } from 'svelte/transition';

	export type CustomFlyParams = {
		delay?: number;
		duration?: number;
		easing?: EasingFunction;
		x?: number | string;
		y?: number | string;
		opacity?: number;
		reversed?: boolean;
	};

	const default_params: Required<CustomFlyParams> = {
		delay: 0,
		duration: 400,
		easing: cubicOut,
		x: '2rem',
		y: 0,
		opacity: 0,
		reversed: false
	};

	let {
		key,
		children,
		params
	}: {
		key: string;
		children: Snippet;
		params?: CustomFlyParams;
	} = $props();

	const component_params: Required<CustomFlyParams> = $derived({
		...default_params,
		...params
	});

	let reversed = $state(component_params.reversed);

	beforeNavigate(({ from, to, type }) => {
		// if navigating to a previous page, or a parent page, reverse the pagetransition direction
		reversed = component_params.reversed;

		if (!from || !to) return;

		const fromPath = from.url.pathname;
		const toPath = to.url.pathname;

		if (fromPath === toPath) return;

		// if type is popstate, only reverse if toPath is not a child of
		// fromPath. reversing the transition direction is undesired when
		// navigating from a parent page to a child page.
		if (type === 'popstate') {
			if (toPath.startsWith(fromPath)) return;
			reversed = !component_params.reversed;
			return;
		}

		if (fromPath.length < toPath.length) return;

		if (fromPath.startsWith(toPath)) {
			reversed = !component_params.reversed;
			return;
		}
	});

	let custom_fly: TransitionFunction = (node, params: CustomFlyParams) => {
		const hydrated_params: Required<CustomFlyParams> = {
			...component_params,
			reversed,
			...params
		};

		const { delay, duration, easing, x, y, opacity, reversed: reversed_param } = hydrated_params;

		const style = getComputedStyle(node);

		const target_opacity = +style.opacity;
		const transform = style.transform === 'none' ? '' : style.transform;

		const opacity_delta = target_opacity * (1 - opacity);
		const [x_value, x_unit] = split_css_unit(x);
		const [y_value, y_unit] = split_css_unit(y);

		return {
			delay,
			duration,
			easing,
			css: (t, u) => `
			    transform: ${transform} translate(${(1 - t) * x_value * (reversed_param ? -1 : 1)}${x_unit}, ${(1 - t) * y_value * (reversed_param ? -1 : 1)}${y_unit});
			    opacity: ${target_opacity - opacity_delta * u};
                position: ${u === 0 ? 'revert-layer' : 'absolute'};  
            `
		};
	};
</script>

<div class="relative">
	{#key key}
		<div
			in:custom_fly
			out:custom_fly={{
				delay: 0,
				reversed: !reversed
			}}
		>
			{@render children()}
		</div>
	{/key}
</div>

<style>
</style>
