<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import * as Avatar from '@/ui/avatar/index.js';

</script>

<ComponentPageHeader name="Avatar" description="Represents a person or account with an image and resilient fallback initials." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Team presence">
		{#snippet preview()}
			<div class="flex items-center gap-3">
				<Avatar.Root><Avatar.Fallback>MC</Avatar.Fallback></Avatar.Root>
				<Avatar.Root><Avatar.Fallback>AV</Avatar.Fallback></Avatar.Root>
				<Avatar.Root><Avatar.Fallback>UI</Avatar.Fallback></Avatar.Root>
			</div>
		{/snippet}
	</DemoBlock>
</section>
