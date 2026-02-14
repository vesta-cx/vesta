<script lang="ts">
	import * as Checkbox from '$lib/components/ui/checkbox/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import InfoIcon from '@lucide/svelte/icons/info';

	let {
		label,
		checked,
		onCheckedChange,
		infoContent,
		class: className = ''
	}: {
		label: string;
		checked: boolean;
		onCheckedChange: (checked: boolean) => void;
		infoContent?: string;
		class?: string;
	} = $props();
</script>

<label
	class="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 {className}"
>
	<Checkbox.Root
		checked={checked}
		onCheckedChange={(v) => onCheckedChange(v === true)}
	/>
	<span class="text-sm">{label}</span>
	{#if infoContent}
		<Popover.Root>
			<Popover.Trigger
				class="text-muted-foreground hover:text-foreground ml-auto rounded p-0.5"
				aria-label="Info"
			>
				<InfoIcon class="size-3.5" />
			</Popover.Trigger>
			<Popover.Content class="w-fit max-w-[16rem] p-3 text-xs" align="end" side="top">
				{infoContent}
			</Popover.Content>
		</Popover.Root>
	{/if}
</label>
