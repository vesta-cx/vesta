<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import * as Breadcrumb from '@vesta-cx/ui/components/ui/breadcrumb';
	import { Separator } from '@vesta-cx/ui/components/ui/separator';
	import * as Sidebar from '@vesta-cx/ui/components/ui/sidebar';
	import AdminSidebar from '$lib/components/admin-sidebar.svelte';

	let { data, children } = $props();

	const breadcrumbLabel = $derived(
		page.url.pathname === '/admin'
			? 'Dashboard'
			: page.url.pathname
					.split('/')
					.filter(Boolean)
					.slice(1)
					.map((s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' '))
					.join(' / ') || 'Dashboard'
	);
</script>

{#if data.session}
	{#if browser}
		<Sidebar.Provider>
			<AdminSidebar email={data.session.email} profilePictureUrl={data.session.profilePictureUrl} />
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
									<Breadcrumb.Link href="/admin">Admin</Breadcrumb.Link>
								</Breadcrumb.Item>
								<Breadcrumb.Separator class="hidden md:block" />
								<Breadcrumb.Item>
									<Breadcrumb.Page>{breadcrumbLabel}</Breadcrumb.Page>
								</Breadcrumb.Item>
							</Breadcrumb.List>
						</Breadcrumb.Root>
					</div>
				</header>
				<div class="flex min-w-0 flex-1 flex-col gap-4 p-4 pt-0">
					{@render children()}
				</div>
			</Sidebar.Inset>
		</Sidebar.Provider>
	{:else}
		<!-- SSR fallback: sidebar uses Tooltip/setContext which fails during SSR -->
		<div class="flex min-h-screen flex-col gap-4 p-4">
			{@render children()}
		</div>
	{/if}
{:else}
	{@render children()}
{/if}
