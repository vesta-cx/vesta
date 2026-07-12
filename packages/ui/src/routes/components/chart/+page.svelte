<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import { ChartLegend, ChartRoot } from '@/ui/chart/index.js';

</script>

<ComponentPageHeader name="Chart" description="Provides chart framing, legends, and overlays for custom SVG or layerchart visuals." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Revenue trend frame">
		{#snippet preview()}
			<div class="w-full max-w-xl space-y-4">
				<ChartRoot class="border bg-card p-4" aspectRatio="2/1">
					<svg viewBox="0 0 300 150" class="h-full w-full" role="img" aria-label="Revenue trend">
						<path d="M0 130 L60 90 L120 105 L180 55 L240 75 L300 25" fill="none" stroke="var(--color-primary)" stroke-width="6" stroke-linecap="round" />
						<path d="M0 120 L60 110 L120 80 L180 90 L240 45 L300 60" fill="none" stroke="var(--color-chart-2)" stroke-width="6" stroke-linecap="round" />
					</svg>
				</ChartRoot>
				<ChartLegend items={[{ label: 'New', color: 'var(--color-primary)' }, { label: 'Expansion', color: 'var(--color-chart-2)' }]} />
			</div>
		{/snippet}
	</DemoBlock>
</section>
