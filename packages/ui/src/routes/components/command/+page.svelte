<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import * as Command from '@/ui/command/index.js';

</script>

<ComponentPageHeader name="Command" description="Filters and executes actions from a keyboard-friendly command palette." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Quick actions">
		{#snippet preview()}
			<Command.Root class="w-full max-w-md rounded-lg border shadow-md">
				<Command.Input placeholder="Search actions..." />
				<Command.List>
					<Command.Empty>No action found.</Command.Empty>
					<Command.Group heading="Actions">
						<Command.Item value="new-dashboard">New dashboard<Command.Shortcut>⌘N</Command.Shortcut></Command.Item>
						<Command.Item value="invite-team">Invite teammate<Command.Shortcut>⌘I</Command.Shortcut></Command.Item>
						<Command.Item value="export-report">Export report<Command.Shortcut>⌘E</Command.Shortcut></Command.Item>
					</Command.Group>
				</Command.List>
			</Command.Root>
		{/snippet}
	</DemoBlock>
</section>
