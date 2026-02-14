<script lang="ts">
	import { settingsStore } from '@vesta-cx/utils/cookies';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import SunIcon from '@lucide/svelte/icons/sun';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import MonitorIcon from '@lucide/svelte/icons/monitor';
	import PaletteIcon from '@lucide/svelte/icons/palette';
	import { cn } from '$lib/utils.js';

	type Theme = 'light' | 'dark' | 'auto';

	let {
		variant = 'dropdown',
		class: className = ''
	}: {
		variant?: 'dropdown' | 'inline';
		class?: string;
	} = $props();

	let theme = $state<Theme>('auto');
	$effect(() => {
		const unsub = settingsStore.subscribe((s) => {
			theme = (s?.theme as Theme) ?? 'auto';
		});
		return unsub;
	});

	const setTheme = (value: Theme) => {
		settingsStore.setKey('theme', value);
	};

	const options: { value: Theme; label: string; icon: typeof SunIcon }[] = [
		{ value: 'light', label: 'Light', icon: SunIcon },
		{ value: 'dark', label: 'Dark', icon: MoonIcon },
		{ value: 'auto', label: 'System', icon: MonitorIcon }
	];
</script>

{#if variant === 'dropdown'}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger
			class={cn(
				'text-muted-foreground hover:text-foreground flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring',
				className
			)}
			aria-label="Theme"
		>
			<PaletteIcon class="size-4" />
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end">
			<DropdownMenu.RadioGroup value={theme} onValueChange={(v) => setTheme(v as Theme)}>
				{#each options as { value: optValue, label, icon: Icon } (optValue)}
					<DropdownMenu.RadioItem value={optValue}>
						<Icon class="size-4" />
						{label}
					</DropdownMenu.RadioItem>
				{/each}
			</DropdownMenu.RadioGroup>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{:else}
	<div class={cn('flex flex-col gap-2', className)}>
		<p class="text-muted-foreground text-sm font-medium">Theme</p>
		<div class="flex gap-1 rounded-lg border border-border p-1">
			{#each options as { value: optValue, label, icon: Icon } (optValue)}
				<button
					type="button"
					onclick={() => setTheme(optValue)}
					class={cn(
						'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
						theme === optValue
							? 'bg-primary text-primary-foreground'
							: 'text-muted-foreground hover:bg-muted hover:text-foreground'
					)}
					aria-pressed={theme === optValue}
					aria-label="Set theme to {label}"
				>
					<Icon class="size-3.5" />
					{label}
				</button>
			{/each}
		</div>
	</div>
{/if}
