<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import { Badge } from '@/ui/badge/index.js';

</script>

<ComponentPageHeader name="Badge" description="Labels records with compact status, category, or priority metadata." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Issue labels">
		{#snippet preview()}
			<div class="flex flex-wrap gap-2">
				<Badge>New</Badge>
				<Badge variant="secondary">In review</Badge>
				<Badge variant="outline">Design</Badge>
				<Badge variant="destructive">Blocked</Badge>
			</div>
		{/snippet}
	</DemoBlock>
</section>
