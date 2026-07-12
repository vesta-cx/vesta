<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import * as HoverCard from '@/ui/hover-card/index.js';
	import { Button } from '@/ui/button/index.js';

</script>

<ComponentPageHeader name="Hover Card" description="Shows richer preview content when hovering or focusing a lightweight trigger." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Account preview">
		{#snippet preview()}
			<HoverCard.Root>
				<HoverCard.Trigger>{#snippet child({ props })}<Button variant="link" {...props}>@acme</Button>{/snippet}</HoverCard.Trigger>
				<HoverCard.Content class="w-80"><div class="space-y-1"><h4 class="text-sm font-semibold">Acme Inc.</h4><p class="text-sm text-muted-foreground">Enterprise account with three active workspaces and a healthy renewal path.</p></div></HoverCard.Content>
			</HoverCard.Root>
		{/snippet}
	</DemoBlock>
</section>
