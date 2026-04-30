<script lang="ts" module>
	import type { Component } from 'svelte';

	export type NavSecondaryItem = {
		title: string;
		href: string;
		icon: Component;
		/** Defaults to false while routes are unbuilt; flip to true when wired. */
		enabled?: boolean;
	};
</script>

<script lang="ts">
	import { page } from '$app/state';
	import * as Sidebar from '@vesta-cx/ui/components/ui/sidebar';
	import { IN_DEVELOPMENT_TOOLTIP } from './nav-collapsible.svelte';

	let {
		items,
		class: className
	}: { items: NavSecondaryItem[]; class?: string } = $props();
</script>

<Sidebar.Group class={className}>
	<Sidebar.GroupContent>
		<Sidebar.Menu>
			{#each items as item (item.title)}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton
						size="sm"
						tooltipContent={item.enabled ? item.title : IN_DEVELOPMENT_TOOLTIP}
						isActive={item.enabled && page.url.pathname.startsWith(item.href)}
					>
						{#snippet child({ props }: { props?: Record<string, unknown> })}
							{#if item.enabled}
								<a href={item.href} {...props}>
									<item.icon />
									<span>{item.title}</span>
								</a>
							{:else}
								<span aria-disabled="true" {...props}>
									<item.icon />
									<span>{item.title}</span>
								</span>
							{/if}
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/each}
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>
