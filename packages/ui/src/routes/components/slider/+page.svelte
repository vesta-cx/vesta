<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import { Slider } from '@/ui/slider/index.js';

	let value = $state(42);
</script>

<ComponentPageHeader name="Slider" description="Adjusts a numeric value or range with pointer and keyboard controls." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Confidence threshold">
		{#snippet preview()}
			<div class="w-full max-w-sm space-y-3"><div class="flex justify-between text-sm"><span>Threshold</span><span class="text-muted-foreground">{value}%</span></div><Slider bind:value type="single" max={100} step={1} /></div>
		{/snippet}
	</DemoBlock>
</section>
