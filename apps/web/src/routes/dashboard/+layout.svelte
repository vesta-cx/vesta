<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import DashboardSidebar from '$lib/components/dashboard-sidebar.svelte';
	import * as Breadcrumb from '@vesta-cx/ui/components/ui/breadcrumb';
	import { Separator } from '@vesta-cx/ui/components/ui/separator';
	import * as Sidebar from '@vesta-cx/ui/components/ui/sidebar';

	let { children } = $props();

	const pageTitle = $derived(
		page.url.pathname === '/dashboard'
			? 'Overview'
			: page.url.pathname
					.split('/')
					.filter(Boolean)
					.slice(1)
					.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '))
					.join(' / ')
	);
</script>

{#if browser}
	<Sidebar.Provider>
		<DashboardSidebar />
		<Sidebar.Inset>
			<header
				class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
			>
				<div class="flex items-center gap-2 px-4">
					<Sidebar.Trigger class="-ms-1" />
					<Separator orientation="vertical" class="me-2 data-[orientation=vertical]:h-4" />
					<Breadcrumb.Root>
						<Breadcrumb.List>
							<Breadcrumb.Item class="hidden md:block">
								<Breadcrumb.Link href="/dashboard">Dashboard</Breadcrumb.Link>
							</Breadcrumb.Item>
							<Breadcrumb.Separator class="hidden md:block" />
							<Breadcrumb.Item>
								<Breadcrumb.Page>{pageTitle}</Breadcrumb.Page>
							</Breadcrumb.Item>
						</Breadcrumb.List>
					</Breadcrumb.Root>
				</div>
			</header>
			<main class="flex min-w-0 flex-1 flex-col gap-4 p-4 pt-0">
				{@render children()}
			</main>
		</Sidebar.Inset>
	</Sidebar.Provider>
{:else}
	<main class="flex min-h-screen flex-col gap-4 p-4">
		{@render children()}
	</main>
{/if}
