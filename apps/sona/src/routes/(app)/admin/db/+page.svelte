<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Accordion from '@vesta-cx/ui/components/ui/accordion';
	import { Button } from '@vesta-cx/ui/components/ui/button';
	import * as Dialog from '@vesta-cx/ui/components/ui/dialog';

	interface Props {
		data: {
			tables: {
				name: string;
				rows: Record<string, unknown>[];
				total: number;
				truncated: boolean;
			}[];
			clearableTables: { key: string; label: string }[];
		};
	}

	let { data, form } = $props();

	let clearDialogOpen = $state(false);
	let confirmStep = $state<'select' | 'confirm'>('select');
	let formRef = $state<HTMLFormElement | null>(null);
	let selectError = $state('');

	$effect(() => {
		if (!clearDialogOpen) {
			confirmStep = 'select';
			selectError = '';
		}
	});

	const formatCell = (v: unknown): string => {
		if (v == null) return '—';
		if (typeof v === 'object') return JSON.stringify(v);
		return String(v);
	};

	const truncate = (s: string, max = 80) => (s.length <= max ? s : s.slice(0, max) + '…');

	const handleClearClick = () => {
		clearDialogOpen = true;
		confirmStep = 'select';
		selectError = '';
	};

	const handleClearSelectedClick = (e: MouseEvent) => {
		e.preventDefault();
		const formEl = formRef;
		if (!formEl) return;
		const checked = formEl.querySelectorAll<HTMLInputElement>('input[name="clear"]:checked');
		if (checked.length === 0) {
			selectError = 'Select at least one table to clear.';
			return;
		}
		selectError = '';
		confirmStep = 'confirm';
	};

	const handleConfirmClear = () => {
		formRef?.requestSubmit();
		clearDialogOpen = false;
		confirmStep = 'select';
	};

	const handleBack = () => {
		confirmStep = 'select';
		selectError = '';
	};

	const handleDialogClose = () => {
		clearDialogOpen = false;
	};

	const getSelectedLabels = () => {
		const formEl = formRef;
		if (!formEl) return [];
		const checked = formEl.querySelectorAll<HTMLInputElement>('input[name="clear"]:checked');
		return Array.from(checked)
			.map((el) => {
				const t = data.clearableTables?.find((x) => x.key === el.value);
				return t?.label;
			})
			.filter(Boolean);
	};
</script>

<svelte:head>
	<title>Database | Admin</title>
</svelte:head>

<div class="min-w-0 space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold">Database Inspector</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				Browse all D1 tables. Large tables are limited to 500 rows.
			</p>
		</div>
		<Button
			type="button"
			variant="outline"
			class="border-destructive text-destructive hover:bg-destructive/10"
			onclick={handleClearClick}
		>
			Clear data
		</Button>
	</div>

	<Dialog.Root bind:open={clearDialogOpen}>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Clear database data</Dialog.Title>
				<Dialog.Description>
					{#if confirmStep === 'select'}
						Select which tables to clear. This action cannot be undone.
					{:else}
						You are about to permanently clear the selected data.
					{/if}
				</Dialog.Description>
			</Dialog.Header>
			<form
				method="POST"
				action="?/clearData"
				use:enhance
				bind:this={formRef}
				class="flex flex-col gap-4"
			>
				<!-- Keep checkboxes in DOM when in confirm step so they are submitted -->
				<div class="flex flex-wrap gap-x-4 gap-y-2" class:hidden={confirmStep === 'confirm'}>
					{#each data.clearableTables ?? [] as t (t.key)}
						<label class="flex cursor-pointer items-center gap-2 text-sm">
							<input type="checkbox" name="clear" value={t.key} class="rounded border-input" />
							<span>{t.label}</span>
						</label>
					{/each}
				</div>
				{#if selectError}
					<p class="text-sm text-destructive">{selectError}</p>
				{/if}
				{#if confirmStep === 'select'}
					<Dialog.Footer>
						<Button type="button" variant="outline" onclick={handleDialogClose}>Cancel</Button>
						<Button type="button" variant="destructive" onclick={handleClearSelectedClick}>
							Clear selected
						</Button>
					</Dialog.Footer>
				{:else}
					<div class="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm">
						<p class="font-medium">The following will be cleared:</p>
						<ul class="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
							{#each getSelectedLabels() as label (label)}
								<li>{label}</li>
							{/each}
						</ul>
						<p class="mt-3 font-medium text-destructive">This cannot be undone.</p>
					</div>
					<Dialog.Footer>
						<Button type="button" variant="outline" onclick={handleBack}>Back</Button>
						<Button type="button" variant="destructive" onclick={handleConfirmClear}>
							Confirm clear
						</Button>
					</Dialog.Footer>
				{/if}
			</form>
		</Dialog.Content>
	</Dialog.Root>

	{#if form?.error}
		<div
			class="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
		>
			{form.error}
		</div>
	{/if}
	{#if form?.success}
		<div
			class="rounded-lg border border-green-500 bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-200"
		>
			{form.message}
		</div>
	{/if}

	{#if data.tables.length === 0}
		<p class="py-12 text-center text-sm text-muted-foreground">
			No database connection (e.g. running outside Workers).
		</p>
	{:else}
		<Accordion.Root type="multiple" class="min-w-0 space-y-2">
			{#each data.tables as table (table.name)}
				<Accordion.Item value={table.name} class="min-w-0 rounded-lg border">
					<Accordion.Trigger
						class="grid w-full grid-cols-[1fr_auto_auto] items-center gap-2 px-4 py-3 text-left font-medium hover:underline [&[data-state=open]>svg]:rotate-180"
					>
						<span>{table.name}</span>
						<span class="text-right text-sm font-normal text-muted-foreground">
							{table.total} row{table.total === 1 ? '' : 's'}
							{#if table.truncated}
								(showing first 500)
							{/if}
						</span>
					</Accordion.Trigger>
					<Accordion.Content class="min-w-0">
						<div class="w-full max-w-full min-w-0 overflow-x-auto px-4 pb-4">
							{#if table.rows.length === 0}
								<p class="py-4 text-center text-sm text-muted-foreground">No rows</p>
							{:else}
								{@const cols = Object.keys(table.rows[0] ?? {})}
								<table class="w-full border-collapse text-left text-sm">
									<thead>
										<tr class="border-b">
											{#each cols as col (col)}
												<th class="bg-muted/50 px-3 py-2 font-medium">{col}</th>
											{/each}
										</tr>
									</thead>
									<tbody>
										{#each table.rows as row, i (i)}
											<tr class="border-b last:border-b-0 hover:bg-muted/30">
												{#each cols as col (col)}
													{@const val = row[col]}
													<td class="max-w-xs truncate px-3 py-2" title={formatCell(val)}>
														{truncate(formatCell(val))}
													</td>
												{/each}
											</tr>
										{/each}
									</tbody>
								</table>
							{/if}
						</div>
					</Accordion.Content>
				</Accordion.Item>
			{/each}
		</Accordion.Root>
	{/if}
</div>
