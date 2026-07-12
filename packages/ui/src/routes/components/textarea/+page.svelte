<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import { Textarea } from '@/ui/textarea/index.js';

</script>

<ComponentPageHeader name="Textarea" description="Collects longer freeform text while matching other form controls." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Internal note">
		{#snippet preview()}
			<Textarea class="w-full max-w-md" rows={5} placeholder="Add a note for the customer success team..." />
		{/snippet}
	</DemoBlock>
</section>
