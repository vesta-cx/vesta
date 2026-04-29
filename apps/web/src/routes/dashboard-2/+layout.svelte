<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import * as Breadcrumb from '@vesta-cx/ui/components/ui/breadcrumb';
	import { Button } from '@vesta-cx/ui/components/ui/button';
	import { Separator } from '@vesta-cx/ui/components/ui/separator';
	import * as Sidebar from '@vesta-cx/ui/components/ui/sidebar';
	import SidebarOrg from '$lib/components/dashboard/sidebar-org.svelte';

	let { children } = $props();

	const title = $derived(
		page.url.pathname === '/dashboard-2'
			? 'Overview'
			: page.url.pathname
					.split('/')
					.filter(Boolean)
					.slice(1)
					.map((s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' '))
					.join(' / ')
	);
</script>

{#if browser}
	<Sidebar.Provider>
		<SidebarOrg />
		<Sidebar.Inset>
			<header
				class="flex h-14 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
			>
				<div class="flex w-full items-center gap-2 px-4">
					<Sidebar.Trigger class="-ms-1" />
					<Separator orientation="vertical" class="me-2 data-[orientation=vertical]:h-4" />
					<Breadcrumb.Root>
						<Breadcrumb.List>
							<Breadcrumb.Item class="hidden md:block">
								<Breadcrumb.Link href="/dashboard-2">Dashboard</Breadcrumb.Link>
							</Breadcrumb.Item>
							<Breadcrumb.Separator class="hidden md:block" />
							<Breadcrumb.Item>
								<Breadcrumb.Page>{title}</Breadcrumb.Page>
							</Breadcrumb.Item>
						</Breadcrumb.List>
					</Breadcrumb.Root>
					<div class="ms-auto flex items-center gap-2">
						<Button variant="ghost" size="sm" href="/dashboard">View variant A</Button>
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
