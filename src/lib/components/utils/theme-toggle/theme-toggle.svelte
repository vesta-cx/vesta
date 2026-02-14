<script lang="ts">
	import { settingsStore } from '@vesta-cx/utils/cookies';
	import { cn } from '$lib/utils.js';

	type Theme = 'light' | 'dark' | 'auto';

	let {
		showLabel = false,
		label = '',
		class: className = ''
	}: {
		showLabel?: boolean;
		label?: string;
		class?: string;
	} = $props();

	let theme = $state<Theme>('auto');

	$effect(() => {
		const unsub = settingsStore.subscribe((s) => {
			theme = (s?.theme as Theme) ?? 'auto';
		});
		return unsub;
	});

	const changeTheme = () => {
		const order: Theme[] = ['auto', 'light', 'dark'];
		const idx = order.indexOf(theme);
		const next = order[(idx + 1) % order.length];
		settingsStore.setKey('theme', next);
	};

	const handleClick = (e: MouseEvent) => {
		e.preventDefault();
		changeTheme();
	};

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === ' ' || e.key === 'Enter') {
			e.preventDefault();
			changeTheme();
		}
	};
</script>

<div
	class={cn('group flex items-center gap-2', className)}
	role="group"
	aria-label="Theme toggle"
	data-theme={theme}
>
	<button
		type="button"
		class="relative z-10 inline-flex aspect-square w-10 cursor-pointer items-center justify-center rounded-full bg-primary transition-all duration-300 hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&_figure]:transition-all [&_figure]:duration-500 [&_figure]:ease-in-out [&_figure_*]:pointer-events-none"
		onclick={handleClick}
		onkeydown={handleKeyDown}
		aria-label="Cycle theme (auto, light, dark)"
		aria-pressed={theme === 'dark'}
		title="Theme: {theme === 'auto' ? 'System' : theme}"
	>
		<figure
			class="pointer-events-none absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 overflow-clip rounded-full bg-secondary"
		>
			<!-- Inner shadow circle -->
			<div
				class="pointer-events-none absolute right-1/2 bottom-1/2 h-6 w-6 scale-75 translate-x-1/2 translate-y-1/2 rounded-full bg-primary"
			></div>
			<!-- Base circle -->
			<div
				class="pointer-events-none absolute right-1/2 bottom-1/2 h-6 w-6 translate-x-1/2 translate-y-1/2 rounded-full bg-primary transition-opacity duration-500 group-data-[theme='light']:opacity-50"
			></div>
			<!-- Moon/sun orb - moves by theme: light (right), auto (center), dark (left) -->
			<div
				class="pointer-events-none absolute -top-[25%] left-full h-6 w-6 rounded-full bg-secondary transition-all duration-500
					group-data-[theme='dark']:-top-[5%] group-data-[theme='dark']:left-[35%]
					group-data-[theme='auto']:-top-[15%] group-data-[theme='auto']:left-1/2 group-data-[theme='auto']:-translate-x-1/2"
			></div>
		</figure>
	</button>

	{#if showLabel && label}
		<span class="text-muted-foreground text-sm font-medium">{label}</span>
	{/if}
</div>
