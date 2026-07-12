<script lang="ts">
	import { page } from '$app/state';
	import { componentEntries } from '$lib/registry/components.js';
	import * as Sidebar from '@/ui/sidebar/index.js';
	import type { ComponentProps } from 'svelte';

	let {
		ref = $bindable(null),
		...restProps
	}: ComponentProps<typeof Sidebar.Root> = $props();

	const readyEntries = $derived(componentEntries.filter((entry) => entry.status === 'ready'));
</script>

<Sidebar.Root
	bind:ref
	collapsible="offcanvas"
	class="top-(--header-height,4rem) !h-[calc(100svh-var(--header-height,4rem))]"
	{...restProps}
>
	<Sidebar.Header>
		<div class="px-2 py-1.5">
			<p class="text-sm font-semibold">Components</p>
			<p class="text-xs text-muted-foreground">
				{readyEntries.length} of {componentEntries.length} ready
			</p>
		</div>
	</Sidebar.Header>
	<Sidebar.Content>
		{#if readyEntries.length > 0}
			<Sidebar.Group>
				<Sidebar.GroupLabel>Ready</Sidebar.GroupLabel>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						{#each readyEntries as entry (entry.slug)}
							{@const href = `/components/${entry.slug}`}
							{@const isActive = page.url.pathname === href}
							<Sidebar.MenuItem>
								<Sidebar.MenuButton {isActive} tooltipContent={entry.name}>
									{#snippet child({ props })}
										<a {href} {...props}>
											<span>{entry.name}</span>
										</a>
									{/snippet}
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
						{/each}
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>
		{/if}

	</Sidebar.Content>
	<Sidebar.Rail />
</Sidebar.Root>
