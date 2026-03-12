<script lang="ts">
	import { Section, SectionContent } from '@vesta-cx/ui/components/layout/section';

	let { children } = $props();
</script>

<Section>
	<SectionContent class="flex flex-col items-center">
		<div class="prose prose-sm w-full max-w-prose text-left text-foreground dark:prose-invert">
			{@render children()}
		</div>
	</SectionContent>
</Section>
