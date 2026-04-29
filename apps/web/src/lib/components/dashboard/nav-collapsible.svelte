<script lang="ts" module>
	import type { Component } from 'svelte';

	export type NavSubItem = { title: string; href: string };

	export type NavItem = {
		title: string;
		href: string;
		icon: Component;
		items?: NavSubItem[];
	};
</script>

<script lang="ts">
	import { page } from '$app/state';
	import * as Collapsible from '@vesta-cx/ui/components/ui/collapsible';
	import * as Sidebar from '@vesta-cx/ui/components/ui/sidebar';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

	let { label, items }: { label: string; items: NavItem[] } = $props();

	// Items with sub-routes match by prefix; leaf items must match exactly so
	// the dashboard root (Analytics) doesn't stay highlighted everywhere.
	const isActive = (item: NavItem) =>
		item.items?.length
			? page.url.pathname === item.href ||
				page.url.pathname.startsWith(`${item.href}/`)
			: page.url.pathname === item.href;
</script>

<Sidebar.Group>
	<Sidebar.GroupLabel>{label}</Sidebar.GroupLabel>
	<Sidebar.Menu>
		{#each items as item (item.title)}
			{@const open = isActive(item)}
			{#if item.items?.length}
				<Collapsible.Root {open} class="group/collapsible">
					{#snippet child({ props }: { props?: Record<string, unknown> })}
						<Sidebar.MenuItem {...props}>
							<Collapsible.Trigger>
								{#snippet child({ props: triggerProps }: { props?: Record<string, unknown> })}
									<Sidebar.MenuButton
										tooltipContent={item.title}
										isActive={isActive(item)}
										{...triggerProps}
									>
										<item.icon />
										<span>{item.title}</span>
										<ChevronRightIcon
											class="ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
										/>
									</Sidebar.MenuButton>
								{/snippet}
							</Collapsible.Trigger>
							<Collapsible.Content>
								<Sidebar.MenuSub>
									{#each item.items ?? [] as sub (sub.title)}
										<Sidebar.MenuSubItem>
											<Sidebar.MenuSubButton isActive={page.url.pathname === sub.href}>
												{#snippet child({ props: linkProps }: { props?: Record<string, unknown> })}
													<a href={sub.href} {...linkProps}>
														<span>{sub.title}</span>
													</a>
												{/snippet}
											</Sidebar.MenuSubButton>
										</Sidebar.MenuSubItem>
									{/each}
								</Sidebar.MenuSub>
							</Collapsible.Content>
						</Sidebar.MenuItem>
					{/snippet}
				</Collapsible.Root>
			{:else}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton tooltipContent={item.title} isActive={isActive(item)}>
						{#snippet child({ props }: { props?: Record<string, unknown> })}
							<a href={item.href} {...props}>
								<item.icon />
								<span>{item.title}</span>
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/if}
		{/each}
	</Sidebar.Menu>
</Sidebar.Group>
