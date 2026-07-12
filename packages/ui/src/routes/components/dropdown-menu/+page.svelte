<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import * as DropdownMenu from '@/ui/dropdown-menu/index.js';
	import { Button } from '@/ui/button/index.js';

</script>

<ComponentPageHeader name="Dropdown Menu" description="Presents a compact set of actions from a trigger without interrupting flow." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Account actions">
		{#snippet preview()}
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>{#snippet child({ props })}<Button variant="outline" {...props}>Open menu</Button>{/snippet}</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end">
					<DropdownMenu.Label>Account</DropdownMenu.Label>
					<DropdownMenu.Item>Profile<DropdownMenu.Shortcut>⌘P</DropdownMenu.Shortcut></DropdownMenu.Item>
					<DropdownMenu.Item>Billing</DropdownMenu.Item>
					<DropdownMenu.Separator />
					<DropdownMenu.Item>Sign out</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		{/snippet}
	</DemoBlock>
</section>
