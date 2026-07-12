<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import * as Breadcrumb from '@/ui/breadcrumb/index.js';

</script>

<ComponentPageHeader name="Breadcrumb" description="Shows where the current page sits in an information hierarchy." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Dashboard path">
		{#snippet preview()}
			<Breadcrumb.Root>
				<Breadcrumb.List>
					<Breadcrumb.Item><Breadcrumb.Link href="/components">Components</Breadcrumb.Link></Breadcrumb.Item>
					<Breadcrumb.Separator />
					<Breadcrumb.Item><Breadcrumb.Link href="/components/card">Surfaces</Breadcrumb.Link></Breadcrumb.Item>
					<Breadcrumb.Separator />
					<Breadcrumb.Item><Breadcrumb.Page>Card</Breadcrumb.Page></Breadcrumb.Item>
				</Breadcrumb.List>
			</Breadcrumb.Root>
		{/snippet}
	</DemoBlock>
</section>
