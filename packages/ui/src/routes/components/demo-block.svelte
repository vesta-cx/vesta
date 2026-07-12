<script lang="ts">
	import * as Tabs from '@/ui/tabs/index.js';
	import type { Snippet } from 'svelte';

	let {
		title,
		description,
		preview,
		code
	}: {
		title?: string;
		description?: string;
		preview: Snippet;
		code?: string;
	} = $props();
</script>

<section class="flex flex-col gap-3">
	{#if title}
		<header class="flex flex-col gap-1">
			<h3 class="text-lg font-semibold tracking-tight">{title}</h3>
			{#if description}
				<p class="text-sm text-muted-foreground">{description}</p>
			{/if}
		</header>
	{/if}

	{#if code}
		<Tabs.Root value="preview" class="gap-0">
			<Tabs.List class="w-fit">
				<Tabs.Trigger value="preview">Preview</Tabs.Trigger>
				<Tabs.Trigger value="code">Code</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content
				value="preview"
				class="mt-2 flex min-h-40 items-center justify-center rounded-lg border bg-card p-8"
			>
				{@render preview()}
			</Tabs.Content>
			<Tabs.Content value="code" class="mt-2">
				<pre
					class="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs leading-relaxed"><code
						>{code}</code
					></pre>
			</Tabs.Content>
		</Tabs.Root>
	{:else}
		<div class="flex min-h-40 items-center justify-center rounded-lg border bg-card p-8">
			{@render preview()}
		</div>
	{/if}
</section>
