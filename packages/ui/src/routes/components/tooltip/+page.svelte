<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import { Button } from '@/ui/button/index.js';
	import * as Tooltip from '@/ui/tooltip/index.js';

</script>

<ComponentPageHeader name="Tooltip" description="Provides concise help for icon-only or ambiguous controls." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Inline help">
		{#snippet preview()}
			<Tooltip.Provider><Tooltip.Root><Tooltip.Trigger>{#snippet child({ props })}<Button variant="outline" size="icon" aria-label="Archive" {...props}>A</Button>{/snippet}</Tooltip.Trigger><Tooltip.Content>Archive conversation</Tooltip.Content></Tooltip.Root></Tooltip.Provider>
		{/snippet}
	</DemoBlock>
</section>
