<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import { Heatmap } from '@/ui/heatmap/index.js';

	const rows = ['Email', 'Chat', 'Phone'];
	const cols = ['Mon', 'Tue', 'Wed', 'Thu'];
	const data = rows.flatMap((row, rowIndex) => cols.map((col, colIndex) => ({ row, col, value: (rowIndex + 1) * (colIndex + 2), label: `${(rowIndex + 1) * (colIndex + 2)} conversations` })));
</script>

<ComponentPageHeader name="Heatmap" description="Compares intensity across two dimensions using an accessible matrix." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Support volume">
		{#snippet preview()}
			<Heatmap {rows} {cols} {data} rowLabel="Channel" colLabel="Weekday" class="w-full max-w-xl" />
		{/snippet}
	</DemoBlock>
</section>
