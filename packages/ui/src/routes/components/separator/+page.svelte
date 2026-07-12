<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import { Separator } from '@/ui/separator/index.js';

</script>

<ComponentPageHeader name="Separator" description="Visually separates related content while preserving semantic structure." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Section divider">
		{#snippet preview()}
			<div class="w-full max-w-sm"><div class="space-y-1"><h4 class="font-medium">Account</h4><p class="text-sm text-muted-foreground">Manage login and billing settings.</p></div><Separator class="my-4" /><div class="flex h-5 items-center gap-4 text-sm"><span>Profile</span><Separator orientation="vertical" /><span>Billing</span><Separator orientation="vertical" /><span>Team</span></div></div>
		{/snippet}
	</DemoBlock>
</section>
