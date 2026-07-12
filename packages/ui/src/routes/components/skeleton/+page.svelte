<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import { Skeleton } from '@/ui/skeleton/index.js';

</script>

<ComponentPageHeader name="Skeleton" description="Reserves space while content loads so the page does not jump." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Loading card">
		{#snippet preview()}
			<div class="w-full max-w-sm space-y-3"><Skeleton class="h-40 w-full rounded-lg" /><Skeleton class="h-4 w-2/3" /><Skeleton class="h-4 w-1/2" /></div>
		{/snippet}
	</DemoBlock>
</section>
