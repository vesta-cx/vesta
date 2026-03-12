<script lang="ts">
	import * as CheckboxWithInfo from '@vesta-cx/ui/components/ui/checkbox-with-info';
	import * as Popover from '@vesta-cx/ui/components/ui/popover';
	import { settingsStore } from '@vesta-cx/utils/cookies';
	import SunIcon from '@lucide/svelte/icons/sun';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import MonitorIcon from '@lucide/svelte/icons/monitor';
	import SettingsIcon from '@lucide/svelte/icons/settings';

	type Theme = 'light' | 'dark' | 'auto';
	const THEME_OPTIONS: { value: Theme; label: string; Icon: typeof SunIcon }[] = [
		{ value: 'light', label: 'Light', Icon: SunIcon },
		{ value: 'dark', label: 'Dark', Icon: MoonIcon },
		{ value: 'auto', label: 'System', Icon: MonitorIcon }
	];

	let {
		enabledModes,
		allowDifferentSong,
		setModeEnabled,
		onAllowDifferentSongChange,
		onSave,
		transitionLabels,
		transitionTooltips,
		modes = ['gapless', 'gap_continue', 'gap_restart']
	}: {
		enabledModes: string[];
		allowDifferentSong: boolean;
		setModeEnabled: (mode: string, checked: boolean) => void;
		onAllowDifferentSongChange: (checked: boolean) => void;
		onSave: () => void;
		transitionLabels: Record<string, string>;
		transitionTooltips: Record<string, string>;
		modes?: string[];
	} = $props();

	let theme = $state<Theme>('auto');
	$effect(() => {
		const unsub = settingsStore.subscribe((s) => {
			theme = (s?.theme as Theme) ?? 'auto';
		});
		return unsub;
	});
</script>

<Popover.Root>
	<Popover.Trigger
		class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
		aria-label="Comparison settings"
	>
		<SettingsIcon class="size-5" />
	</Popover.Trigger>
	<Popover.Content class="w-72 p-4" align="start" side="top">
		<div class="mb-4 flex flex-col gap-2">
			<p class="text-sm font-medium text-muted-foreground">Theme</p>
			<div class="flex gap-1 rounded-lg border border-border p-1">
				{#each THEME_OPTIONS as { value: optValue, label, Icon } (optValue)}
					<button
						type="button"
						onclick={() => settingsStore.setKey('theme', optValue)}
						class="flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors {theme ===
						optValue
							? 'bg-primary text-primary-foreground'
							: 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
						aria-pressed={theme === optValue}
						aria-label="Set theme to {label}"
					>
						<Icon class="size-3.5" />
						{label}
					</button>
				{/each}
			</div>
		</div>
		<p class="mb-3 text-sm font-medium text-muted-foreground">Comparison modes</p>
		<p class="mb-3 text-xs text-muted-foreground">
			Enable or disable transition types. Changes apply to the next round.
		</p>
		<div class="flex flex-col gap-2">
			{#each modes as mode}
				<CheckboxWithInfo.Root
					label={transitionLabels[mode] ?? mode}
					checked={enabledModes.includes(mode)}
					onCheckedChange={(v) => setModeEnabled(mode, v)}
					infoContent={transitionTooltips[mode]}
				/>
			{/each}
			{#if allowDifferentSong}
				<div
					class="flex items-start gap-2 rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-muted-foreground"
				>
					<input type="checkbox" checked disabled class="mt-0.5 size-4 shrink-0" />
					<div class="text-xs">
						<span class="font-medium"
							>{transitionLabels['gap_pause_resume'] ?? 'Gap (pause/resume)'}</span
						>
						<span class="block text-muted-foreground">
							Different-song rounds use pause/resume.
						</span>
					</div>
				</div>
			{/if}
		</div>
		<CheckboxWithInfo.Root
			label="Compare different songs"
			checked={allowDifferentSong}
			onCheckedChange={onAllowDifferentSongChange}
			infoContent="When enabled, some comparisons will pit two different tracks against each other. Disable to only compare encodings of the same song."
			class="mt-3"
		/>
		<button
			type="button"
			onclick={onSave}
			class="mt-3 w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
		>
			Save
		</button>
		<a
			href="/survey/setup"
			class="mt-2 flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
		>
			Change device
		</a>
	</Popover.Content>
</Popover.Root>
