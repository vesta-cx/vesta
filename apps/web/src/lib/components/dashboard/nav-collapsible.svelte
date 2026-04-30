<script lang="ts" module>
	import type { Component } from 'svelte';

	export type NavSubItem = { title: string; href: string; enabled?: boolean };

	export type NavItem = {
		title: string;
		href: string;
		icon: Component;
		items?: NavSubItem[];
		/** Defaults to false while routes are unbuilt; flip to true when wired. */
		enabled?: boolean;
	};

	export const IN_DEVELOPMENT_TOOLTIP = 'In development';
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

	// Track which sections are open. Auto-open the active section so its
	// sub-items are visible after a navigation.
	const openSections = $state<Record<string, boolean>>({});
	$effect(() => {
		for (const item of items) {
			if (item.items?.length && isActive(item) && openSections[item.title] !== false) {
				openSections[item.title] = true;
			}
		}
	});
</script>

<Sidebar.Group>
	<Sidebar.GroupLabel>{label}</Sidebar.GroupLabel>
	<Sidebar.Menu>
		{#each items as item (item.title)}
			{@const active = isActive(item)}
			{#if item.items?.length}
				<Collapsible.Root
					open={openSections[item.title] ?? false}
					onOpenChange={(value) => (openSections[item.title] = value)}
					class="group/collapsible"
				>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton
							tooltipContent={item.enabled ? item.title : IN_DEVELOPMENT_TOOLTIP}
							isActive={active}
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
						<Collapsible.Trigger>
							{#snippet child({ props }: { props?: Record<string, unknown> })}
								<Sidebar.MenuAction
									class="transition-transform group-data-[state=open]/collapsible:rotate-90"
									{...props}
								>
									<ChevronRightIcon />
									<span class="sr-only">Toggle {item.title}</span>
								</Sidebar.MenuAction>
							{/snippet}
						</Collapsible.Trigger>
						<Collapsible.Content>
							<Sidebar.MenuSub>
								{#each item.items ?? [] as sub (sub.title)}
									<Sidebar.MenuSubItem>
										<Sidebar.MenuSubButton isActive={page.url.pathname === sub.href}>
											{#snippet child({ props }: { props?: Record<string, unknown> })}
												{#if sub.enabled}
													<a href={sub.href} {...props}>
														<span>{sub.title}</span>
													</a>
												{:else}
													<span
														aria-disabled="true"
														title={IN_DEVELOPMENT_TOOLTIP}
														{...props}
													>
														<span>{sub.title}</span>
													</span>
												{/if}
											{/snippet}
										</Sidebar.MenuSubButton>
									</Sidebar.MenuSubItem>
								{/each}
							</Sidebar.MenuSub>
						</Collapsible.Content>
					</Sidebar.MenuItem>
				</Collapsible.Root>
			{:else}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton
						tooltipContent={item.enabled ? item.title : IN_DEVELOPMENT_TOOLTIP}
						isActive={active}
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
			{/if}
		{/each}
	</Sidebar.Menu>
</Sidebar.Group>
