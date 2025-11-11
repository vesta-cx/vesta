<script lang="ts">
	import { stripUnit, type LengthUnit, type Prettify } from '@vesta-cx/utils';

	type BaseMaskOptions = {
		gradient: 'linear' | 'radial';
	};

	type Anchor = `top` | `bottom` | `left` | `right`;

	type Position =
		| `${number}${LengthUnit} ${number}${LengthUnit}`
		| `at ${Anchor}`
		| `at ${Anchor} ${Anchor}`;

	type LinearMaskOptions = BaseMaskOptions & {
		gradient?: 'linear';
		angle: `${number}deg` | `to ${Anchor}` | `to ${Anchor} ${Anchor}`;
	};

	type RadialMaskOptions = BaseMaskOptions & {
		gradient: 'radial';
		position: Position;
	};

	type GradientBlurProps = {
		blur: `${number}${LengthUnit}` | number;
		detail: number;
		mask: LinearMaskOptions | RadialMaskOptions;
	};

	let {
		blur = `64px`,
		detail = 8,
		mask = { gradient: 'linear', angle: 'to top' },
		class: className = ''
	}: GradientBlurProps & { class?: string } = $props();

	// exponentially space blur values from 0 to blur, in steps of {detail}
	// using the formula: f(x) = 0.5^7 blur 2^(8x)

	const blurValues = Array.from({ length: detail }, (_, i) => {
		const [number, unit] = typeof blur === 'number' ? [blur, 'px'] : stripUnit(blur);
		const a = i / detail;
		return `${0.5 ** 7 * number * 2 ** (8 * a)}${unit}`;
	});

	const getMaskStops = (i: number) => {
		const stops: string[] = [];
		for (let j = 0; j < 4; j++) {
			const a = (i + j) / detail;
			stops.push(`--mask-stop-${j + 1}: ${j == 0 || j == 3 ? 'transparent' : 'black'} ${a * 100}%`);
		}
		return stops.join('; ');
	};

	const getMask = (i: number, mask: LinearMaskOptions | RadialMaskOptions) => {
		if (mask.gradient === 'linear') {
			return `linear-gradient(${mask.angle}, var(--mask-stop-1), var(--mask-stop-2), var(--mask-stop-3), var(--mask-stop-4))`;
		}
		return `radial-gradient(${mask.position}, var(--mask-stop-1), var(--mask-stop-2), var(--mask-stop-3), var(--mask-stop-4))`;
	};
</script>

<div class="absolute z-0 -inset-4 {className}">
	{#each blurValues as blur, i}
		<div
			class="
            absolute
            inset-0
            z-(--z-index)
            mask-(--mask-image)
            supports-backdrop-filter:backdrop-blur-(--blur)
        "
			style={`--z-index: ${i}; --blur: ${blur}; ${getMaskStops(i)}; --mask-image: ${getMask(i, mask)}`}
		></div>
	{/each}
</div>

<style>
</style>
