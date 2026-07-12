<script lang="ts">
	import { page } from '$app/state';
	import { findComponent } from '$lib/registry/components.js';
	import * as Sidebar from '@/ui/sidebar/index.js';
	import { Separator } from '@/ui/separator/index.js';
	import ComponentsSidebar from './components-sidebar.svelte';

	let { children } = $props();

	const currentSlug = $derived(page.url.pathname.split('/')[2]);
	const current = $derived(currentSlug ? findComponent(currentSlug) : undefined);
</script>

<Sidebar.Provider class="!min-h-[calc(100svh-var(--header-height,4rem))] pt-(--header-height,4rem)">
	<ComponentsSidebar />
	<Sidebar.Inset class="bg-background">
		<header class="flex h-12 shrink-0 items-center gap-2 border-b px-4">
			<Sidebar.Trigger class="-ms-1" />
			<Separator orientation="vertical" class="me-2 data-[orientation=vertical]:h-4" />
			<nav class="flex items-center gap-1.5 text-sm">
				<a href="/components" class="text-muted-foreground hover:text-foreground">Components</a>
				{#if current}
					<span class="text-muted-foreground">/</span>
					<span class="font-medium">{current.name}</span>
				{/if}
			</nav>
		</header>
		<div class="flex flex-1 flex-col gap-8 p-6 lg:p-10">
			{@render children()}
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
