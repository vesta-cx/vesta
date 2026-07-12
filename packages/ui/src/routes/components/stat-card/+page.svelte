<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import { StatCard } from '@/ui/stat-card/index.js';

</script>

<ComponentPageHeader name="Stat Card" description="Highlights a metric with optional helper text in dashboard grids." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Dashboard metric">
		{#snippet preview()}
			<div class="grid w-full max-w-2xl gap-3 sm:grid-cols-3"><StatCard label="ARR" value="$1.2M" helper="+12% this quarter" /><StatCard label="Health" value="94%" helper="2 accounts at risk" /><StatCard label="NPS" value={61} helper="Last 30 days" /></div>
		{/snippet}
	</DemoBlock>
</section>
