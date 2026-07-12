<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import { Spinner } from '@/ui/spinner/index.js';

</script>

<ComponentPageHeader name="Spinner" description="Signals an indeterminate loading state inside buttons, cards, and empty surfaces." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Loading indicator">
		{#snippet preview()}
			<div class="flex items-center gap-3 text-sm text-muted-foreground"><Spinner /> Syncing workspace...</div>
		{/snippet}
	</DemoBlock>
</section>
