<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import * as NativeSelect from '@/ui/native-select/index.js';

</script>

<ComponentPageHeader name="Native Select" description="Uses the platform select control while matching the library’s visual style." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Native plan picker">
		{#snippet preview()}
			<NativeSelect.Root value="growth" aria-label="Plan"><NativeSelect.Option value="starter">Starter</NativeSelect.Option><NativeSelect.Option value="growth">Growth</NativeSelect.Option><NativeSelect.Option value="enterprise">Enterprise</NativeSelect.Option></NativeSelect.Root>
		{/snippet}
	</DemoBlock>
</section>
