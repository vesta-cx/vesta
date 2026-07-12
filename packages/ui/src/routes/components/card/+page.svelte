<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import * as Card from '@/ui/card/index.js';
	import { Button } from '@/ui/button/index.js';

</script>

<ComponentPageHeader name="Card" description="Groups content and actions into a contained, scannable surface." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Account summary">
		{#snippet preview()}
			<Card.Root class="w-full max-w-sm">
				<Card.Header><Card.Title>Starter plan</Card.Title><Card.Description>Good for validating a workspace.</Card.Description></Card.Header>
				<Card.Content><p class="text-3xl font-semibold">$19<span class="text-sm font-normal text-muted-foreground">/mo</span></p></Card.Content>
				<Card.Footer><Button class="w-full">Upgrade</Button></Card.Footer>
			</Card.Root>
		{/snippet}
	</DemoBlock>
</section>
