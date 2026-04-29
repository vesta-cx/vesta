<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import * as Breadcrumb from '@vesta-cx/ui/components/ui/breadcrumb';
	import { Button } from '@vesta-cx/ui/components/ui/button';
	import { Separator } from '@vesta-cx/ui/components/ui/separator';
	import * as Sidebar from '@vesta-cx/ui/components/ui/sidebar';
	import SidebarClassic from '$lib/components/dashboard/sidebar-classic.svelte';
	import { creatorNav } from '$lib/components/dashboard/data';

	let { children } = $props();

	const segments = $derived(page.url.pathname.split('/').filter(Boolean).slice(1));

	const breadcrumbs = $derived(
		segments.length === 0
			? [{ title: 'Overview', href: '/dashboard' }]
			: segments.map((segment, index) => {
					const href = '/dashboard/' + segments.slice(0, index + 1).join('/');
					const navMatch = creatorNav.find(
						(item) => item.href === href || item.items?.some((sub) => sub.href === href)
					);
					const subMatch = creatorNav
						.flatMap((item) => item.items ?? [])
						.find((sub) => sub.href === href);
					const title =
						subMatch?.title ??
						navMatch?.title ??
						segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
					return { title, href };
				})
	);
</script>

{#if browser}
	<Sidebar.Provider>
		<SidebarClassic />
		<Sidebar.Inset>
			<header
				class="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
			>
				<div class="flex w-full items-center gap-2 px-4">
					<Sidebar.Trigger class="-ms-1" />
					<Separator orientation="vertical" class="me-2 data-[orientation=vertical]:h-4" />
					<Breadcrumb.Root>
						<Breadcrumb.List>
							<Breadcrumb.Item class="hidden md:block">
								<Breadcrumb.Link href="/dashboard">Dashboard</Breadcrumb.Link>
							</Breadcrumb.Item>
							{#each breadcrumbs as crumb, index (crumb.href)}
								<Breadcrumb.Separator class="hidden md:block" />
								<Breadcrumb.Item>
									{#if index === breadcrumbs.length - 1}
										<Breadcrumb.Page>{crumb.title}</Breadcrumb.Page>
									{:else}
										<Breadcrumb.Link href={crumb.href}>{crumb.title}</Breadcrumb.Link>
									{/if}
								</Breadcrumb.Item>
							{/each}
						</Breadcrumb.List>
					</Breadcrumb.Root>
					<div class="ms-auto flex items-center gap-2">
						<Button variant="ghost" size="sm" href="/dashboard-2">Label view</Button>
						<Button variant="ghost" size="sm" href="/dashboard-3">Cockpit</Button>
					</div>
				</div>
			</header>
			<div class="flex flex-1 flex-col gap-6 p-4 md:p-6">
				{@render children()}
			</div>
		</Sidebar.Inset>
	</Sidebar.Provider>
{:else}
	<div class="flex min-h-screen flex-col gap-6 p-6">{@render children()}</div>
{/if}
