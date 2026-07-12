<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import * as Pagination from '@/ui/pagination/index.js';

</script>

<ComponentPageHeader name="Pagination" description="Splits long result sets into navigable pages with accessible controls." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Search results pages">
		{#snippet preview()}
			<Pagination.Root count={120} perPage={10} siblingCount={1}>
				{#snippet children({ pages, currentPage })}
					<Pagination.Content>
						<Pagination.Item><Pagination.PrevButton /></Pagination.Item>
						{#each pages as page (page.key)}
							<Pagination.Item>{#if page.type === 'ellipsis'}<Pagination.Ellipsis />{:else}<Pagination.Link {page} isActive={currentPage === page.value}>{page.value}</Pagination.Link>{/if}</Pagination.Item>
						{/each}
						<Pagination.Item><Pagination.NextButton /></Pagination.Item>
					</Pagination.Content>
				{/snippet}
			</Pagination.Root>
		{/snippet}
	</DemoBlock>
</section>
