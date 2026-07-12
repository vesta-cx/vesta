<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import * as Item from '@/ui/item/index.js';
	import { Badge } from '@/ui/badge/index.js';
	import { Button } from '@/ui/button/index.js';

</script>

<ComponentPageHeader name="Item" description="A flexible row pattern for lists, feeds, settings, and command-like surfaces." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Inbox row">
		{#snippet preview()}
			<Item.Root class="w-full max-w-xl">
				<Item.Media>VC</Item.Media><Item.Content><Item.Title>Vesta Customer Workspace</Item.Title><Item.Description>3 new escalations need review before tomorrow’s QBR.</Item.Description></Item.Content><Item.Actions><Badge variant="secondary">3</Badge><Button size="sm" variant="outline">Open</Button></Item.Actions>
			</Item.Root>
		{/snippet}
	</DemoBlock>
</section>
