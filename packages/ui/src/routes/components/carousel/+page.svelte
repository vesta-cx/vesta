<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import * as Carousel from '@/ui/carousel/index.js';

</script>

<ComponentPageHeader name="Carousel" description="Browses a small set of featured panels without leaving the current context." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Featured reports">
		{#snippet preview()}
			<Carousel.Root class="w-full max-w-xs">
				<Carousel.Content>
					{#each ['Pipeline', 'Retention', 'Expansion'] as report, index (report)}
						<Carousel.Item>
							<div class="p-1"><div class="flex aspect-square items-center justify-center rounded-lg border bg-muted text-2xl font-semibold">{index + 1}<span class="sr-only">{report}</span></div></div>
						</Carousel.Item>
					{/each}
				</Carousel.Content>
				<Carousel.Previous />
				<Carousel.Next />
			</Carousel.Root>
		{/snippet}
	</DemoBlock>
</section>
