<script lang="ts" module>
	import type { Component } from 'svelte';

	export type NavSecondaryItem = {
		title: string;
		href: string;
		icon: Component;
	};
</script>

<script lang="ts">
	import { page } from '$app/state';
	import * as Sidebar from '@vesta-cx/ui/components/ui/sidebar';

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
						tooltipContent={item.title}
						isActive={page.url.pathname.startsWith(item.href)}
					>
						{#snippet child({ props }: { props?: Record<string, unknown> })}
							<a href={item.href} {...props}>
								<item.icon />
								<span>{item.title}</span>
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/each}
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>
