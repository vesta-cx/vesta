<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import * as Sheet from '@/ui/sheet/index.js';
	import { Button } from '@/ui/button/index.js';

</script>

<ComponentPageHeader name="Sheet" description="Slides a side panel over the page for persistent settings or details." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Settings sheet">
		{#snippet preview()}
			<Sheet.Root><Sheet.Trigger>{#snippet child({ props })}<Button variant="outline" {...props}>Open settings</Button>{/snippet}</Sheet.Trigger><Sheet.Content><Sheet.Header><Sheet.Title>Workspace settings</Sheet.Title><Sheet.Description>Adjust account defaults without leaving the page.</Sheet.Description></Sheet.Header><div class="py-4 text-sm text-muted-foreground">Notifications are currently enabled for all admins.</div><Sheet.Footer><Sheet.Close>{#snippet child({ props })}<Button {...props}>Done</Button>{/snippet}</Sheet.Close></Sheet.Footer></Sheet.Content></Sheet.Root>
		{/snippet}
	</DemoBlock>
</section>
