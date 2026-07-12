<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import * as Empty from '@/ui/empty/index.js';
	import { Button } from '@/ui/button/index.js';

</script>

<ComponentPageHeader name="Empty" description="Explains an empty state and offers the next useful action." />

<section class="flex flex-col gap-8">
	<DemoBlock title="No reports yet">
		{#snippet preview()}
			<Empty.Root class="w-full max-w-md">
				<Empty.Header><Empty.Media>∅</Empty.Media><Empty.Title>No reports yet</Empty.Title><Empty.Description>Create your first saved report to track recurring questions.</Empty.Description></Empty.Header>
				<Empty.Content><Button>Create report</Button></Empty.Content>
			</Empty.Root>
		{/snippet}
	</DemoBlock>
</section>
