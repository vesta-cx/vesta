<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import * as Accordion from '@/ui/accordion/index.js';

</script>

<ComponentPageHeader name="Accordion" description="Stacks related sections and lets people reveal one answer at a time." />

<section class="flex flex-col gap-8">
	<DemoBlock title="FAQ disclosure">
		{#snippet preview()}
			<Accordion.Root type="single" value="billing" class="w-full max-w-xl">
				<Accordion.Item value="billing">
					<Accordion.Trigger>How does billing work?</Accordion.Trigger>
					<Accordion.Content>Plans renew monthly and can be changed before the next invoice.</Accordion.Content>
				</Accordion.Item>
				<Accordion.Item value="team">
					<Accordion.Trigger>Can I invite my team?</Accordion.Trigger>
					<Accordion.Content>Yes. Admins can add teammates and adjust roles from settings.</Accordion.Content>
				</Accordion.Item>
			</Accordion.Root>
		{/snippet}
	</DemoBlock>
</section>
