<script lang="ts" module>
	import type { Component, Snippet } from 'svelte';

	export type SettingsCategory = {
		id: string;
		title: string;
		icon: Component;
		/** Defaults to false; flip to true once the category is wired. */
		enabled?: boolean;
		content?: Snippet;
	};
</script>

<script lang="ts">
	import * as Dialog from '@vesta-cx/ui/components/ui/dialog';
	import { IN_DEVELOPMENT_TOOLTIP } from '$lib/components/dashboard/nav-collapsible.svelte';

	let {
		open = $bindable(false),
		categories,
		initialCategoryId
	}: {
		open?: boolean;
		categories: SettingsCategory[];
		initialCategoryId?: string;
	} = $props();

	let activeId = $state(initialCategoryId ?? categories.find((c) => c.enabled)?.id ?? categories[0]?.id);
	const active = $derived(categories.find((c) => c.id === activeId) ?? categories[0]);
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="gap-0 overflow-hidden p-0 sm:max-w-3xl">
		<Dialog.Header class="sr-only">
			<Dialog.Title>Settings</Dialog.Title>
			<Dialog.Description>
				Manage your account, workspace, and preferences.
			</Dialog.Description>
		</Dialog.Header>

		<div class="grid min-h-[30rem] grid-cols-[12rem_1fr]">
			<nav class="flex flex-col gap-1 border-e bg-muted/30 p-3">
				<p class="px-2 pb-1 text-xs font-medium text-muted-foreground">Settings</p>
				{#each categories as category (category.id)}
					{@const isActive = category.id === activeId}
					{@const disabled = category.enabled === false}
					<button
						type="button"
						class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-muted data-[active=true]:font-medium"
						data-active={isActive}
						aria-disabled={disabled ? 'true' : undefined}
						title={disabled ? IN_DEVELOPMENT_TOOLTIP : undefined}
						{disabled}
						onclick={() => (activeId = category.id)}
					>
						<category.icon class="size-4" />
						<span>{category.title}</span>
					</button>
				{/each}
			</nav>

			<div class="max-h-[36rem] overflow-y-auto p-6">
				{#if active?.content}
					{@render active.content()}
				{/if}
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
