<script lang="ts">
	import { enhance } from '$app/forms';
	import { Checkbox } from '@vesta-cx/ui/components/ui/checkbox';
	import * as Dialog from '@vesta-cx/ui/components/ui/dialog';
	import { Button } from '@vesta-cx/ui/components/ui/button';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { toast } from 'svelte-sonner';

	let { data, form } = $props();

	let filter = $state<'all' | 'approved' | 'pending'>('all');
	let selectedIds = $state<Set<string>>(new Set());
	let editDialogOpen = $state(false);
	let addDialogOpen = $state(false);
	let editingDevice = $state<{
		id: string;
		brand: string;
		model: string;
		deviceType: string;
		connectionType: string;
		priceTier: string;
	} | null>(null);
	let newDevice = $state({
		brand: '',
		model: '',
		deviceType: 'headphones',
		connectionType: 'wired',
		priceTier: 'mid'
	});

	const filteredDevices = $derived(
		data.devices.filter((d) => {
			if (filter === 'approved') return d.approvedAt !== null;
			if (filter === 'pending') return d.approvedAt === null;
			return true;
		})
	);

	const allDeviceIds = $derived(filteredDevices.map((d) => d.id));
	const allSelected = $derived(
		filteredDevices.length > 0 && filteredDevices.every((d) => selectedIds.has(d.id))
	);
	const someSelected = $derived(selectedIds.size > 0);
	const isIndeterminate = $derived(someSelected && !allSelected);

	const handleSelectAllChange = (checked: boolean | 'indeterminate') => {
		if (checked === true || checked === 'indeterminate') {
			selectedIds = new Set(allDeviceIds);
		} else {
			selectedIds = new Set();
		}
	};

	const handleSelectChange = (id: string, checked: boolean | 'indeterminate') => {
		const next = new Set(selectedIds);
		if (checked === true) next.add(id);
		else next.delete(id);
		selectedIds = next;
	};

	const handleApproveResult = (opts: {
		result?: { type?: string; data?: { approved?: number } };
		update?: () => Promise<void>;
	}) => {
		if (opts?.result?.type === 'success' && opts.result?.data?.approved != null) {
			toast.success(
				opts.result.data.approved === 1
					? 'Device approved'
					: `${opts.result.data.approved} devices approved`
			);
			selectedIds = new Set();
		}
		opts?.update?.();
	};

	const handleRemoveResult = (opts: {
		result?: { type?: string; data?: { removed?: number | boolean; skipped?: number } };
		update?: () => Promise<void>;
	}) => {
		if (opts?.result?.type === 'success' && opts.result?.data != null) {
			const { removed, skipped = 0 } = opts.result.data;
			if (removed === true || (typeof removed === 'number' && removed > 0)) {
				toast.success(
					removed === true || removed === 1
						? 'Device deleted'
						: `${removed} devices deleted${skipped > 0 ? ` (${skipped} skipped: used in responses)` : ''}`
				);
				selectedIds = new Set();
			}
		}
		opts?.update?.();
	};

	const handleUpdateResult = (opts: {
		result?: { type?: string; data?: { success?: boolean } };
		update?: (options?: { reset?: boolean }) => Promise<void>;
	}) => {
		if (opts?.result?.type === 'success' && opts?.result?.data?.success) {
			toast.success('Device updated');
			editDialogOpen = false;
			editingDevice = null;
		}
		opts?.update?.({ reset: false });
	};

	const openEdit = (device: (typeof data.devices)[number]) => {
		editingDevice = {
			id: device.id,
			brand: device.brand,
			model: device.model,
			deviceType: device.deviceType,
			connectionType: device.connectionType,
			priceTier: device.priceTier
		};
		editDialogOpen = true;
	};

	const openAdd = () => {
		newDevice = {
			brand: '',
			model: '',
			deviceType: 'headphones',
			connectionType: 'wired',
			priceTier: 'mid'
		};
		addDialogOpen = true;
	};

	const handleCreateResult = (opts: {
		result?: { type?: string; data?: { success?: boolean } };
		update?: (options?: { reset?: boolean }) => Promise<void>;
	}) => {
		if (opts?.result?.type === 'success' && opts?.result?.data?.success) {
			toast.success('Device added (pending approval)');
			addDialogOpen = false;
		}
		opts?.update?.({ reset: false });
	};
</script>

<svelte:head>
	<title>Devices | Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-wrap items-center justify-between gap-4">
		<h1 class="text-2xl font-bold">Listening Devices</h1>
		<div class="flex items-center gap-2">
			<Button type="button" size="sm" onclick={openAdd}>
				<Plus class="size-4" aria-hidden="true" />
				Add device
			</Button>
			{#each ['all', 'approved', 'pending'] as f}
				<button
					type="button"
					class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors {filter === f
						? 'bg-primary text-primary-foreground'
						: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
					onclick={() => (filter = f as typeof filter)}
				>
					{f.charAt(0).toUpperCase() + f.slice(1)}
				</button>
			{/each}
		</div>
	</div>

	{#if form?.error}
		<div
			class="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
		>
			{form.error}
		</div>
	{/if}

	{#if filteredDevices.length === 0}
		<p class="py-12 text-center text-sm text-muted-foreground">No devices found.</p>
	{:else}
		<div class="space-y-4">
			<div class="flex items-center justify-between gap-4 rounded-lg border bg-muted/50 px-4 py-2">
				<span class="text-sm text-muted-foreground">
					{someSelected
						? `${selectedIds.size} device${selectedIds.size === 1 ? '' : 's'} selected`
						: 'Select devices to approve or delete'}
				</span>
				<div class="flex gap-2">
					<form
						method="POST"
						action="?/approveBulk"
						use:enhance={() => (opts) => handleApproveResult(opts)}
						class="inline"
					>
						{#each [...selectedIds] as id}
							<input type="hidden" name="ids" value={id} />
						{/each}
						<button
							type="submit"
							disabled={!someSelected}
							class="flex items-center gap-2 rounded px-2 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
						>
							<CircleCheck class="size-4" aria-hidden="true" />
							Approve
						</button>
					</form>
					<form
						method="POST"
						action="?/removeBulk"
						use:enhance={() => (opts) => handleRemoveResult(opts)}
						class="inline"
					>
						{#each [...selectedIds] as id}
							<input type="hidden" name="ids" value={id} />
						{/each}
						<button
							type="submit"
							disabled={!someSelected}
							class="flex items-center gap-2 rounded px-2 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
							onclick={(e) => {
								if (
									!someSelected ||
									!confirm(
										`Delete ${selectedIds.size} device${selectedIds.size === 1 ? '' : 's'}? Devices used in responses will be skipped.`
									)
								) {
									e.preventDefault();
								}
							}}
						>
							<Trash2 class="size-4" aria-hidden="true" />
							Delete
						</button>
					</form>
				</div>
			</div>

			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b">
							<th class="w-10 px-2 py-2 pr-0">
								<Checkbox
									checked={allSelected}
									indeterminate={isIndeterminate}
									onCheckedChange={handleSelectAllChange}
									aria-label="Select all devices"
								/>
							</th>
							<th class="px-4 py-2 text-left font-medium">Brand / Model</th>
							<th class="px-4 py-2 text-left font-medium">Type</th>
							<th class="px-4 py-2 text-left font-medium">Connection</th>
							<th class="px-4 py-2 text-left font-medium">Tier</th>
							<th class="px-4 py-2 text-left font-medium">Status</th>
							<th class="px-4 py-2 text-left font-medium">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredDevices as device}
							<tr class="border-b">
								<td class="w-10 px-2 py-2 pr-0">
									<Checkbox
										checked={selectedIds.has(device.id)}
										onCheckedChange={(v) => handleSelectChange(device.id, v)}
										aria-label="Select {device.brand} {device.model}"
									/>
								</td>
								<td class="px-4 py-2">
									<span class="font-medium">{device.brand}</span>
									<span class="text-muted-foreground"> {device.model}</span>
								</td>
								<td class="px-4 py-2 capitalize">{device.deviceType}</td>
								<td class="px-4 py-2 capitalize">{device.connectionType}</td>
								<td class="px-4 py-2 capitalize">{device.priceTier}</td>
								<td class="px-4 py-2">
									{#if device.approvedAt}
										<span
											class="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800 dark:bg-green-900 dark:text-green-200"
										>
											Approved
										</span>
									{:else}
										<span
											class="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
										>
											Pending
										</span>
									{/if}
								</td>
								<td class="px-4 py-2">
									<div class="flex items-center gap-2">
										<button
											type="button"
											class="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
											onclick={() => openEdit(device)}
										>
											<Pencil class="size-3.5" aria-hidden="true" />
											Edit
										</button>
										{#if device.approvedAt}
											<form method="POST" action="?/reject" use:enhance class="inline">
												<input type="hidden" name="id" value={device.id} />
												<button type="submit" class="text-xs text-destructive hover:underline">
													Revoke
												</button>
											</form>
										{:else}
											<form method="POST" action="?/approve" use:enhance class="inline">
												<input type="hidden" name="id" value={device.id} />
												<button type="submit" class="text-xs text-primary hover:underline">
													Approve
												</button>
											</form>
										{/if}
										<form
											method="POST"
											action="?/remove"
											use:enhance={() => (opts) => handleRemoveResult(opts)}
											class="inline"
										>
											<input type="hidden" name="id" value={device.id} />
											<button
												type="submit"
												class="text-xs text-muted-foreground hover:text-destructive hover:underline"
												onclick={(e) => {
													if (
														!confirm(
															'Delete this device? It cannot be deleted if used in responses.'
														)
													) {
														e.preventDefault();
													}
												}}
											>
												Delete
											</button>
										</form>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>

<!-- Edit device dialog -->
<Dialog.Root bind:open={editDialogOpen} onOpenChange={(v) => !v && (editingDevice = null)}>
	<Dialog.Content class="max-w-md">
		<Dialog.Header>
			<Dialog.Title>Edit device</Dialog.Title>
			<Dialog.Description>Update brand, model, type, connection, or price tier.</Dialog.Description>
		</Dialog.Header>
		{#if editingDevice}
			<form
				method="POST"
				action="?/update"
				use:enhance={() => (opts) => handleUpdateResult(opts)}
				class="space-y-4"
			>
				<input type="hidden" name="id" value={editingDevice.id} />
				<div class="space-y-2">
					<label for="edit_device_type" class="text-sm font-medium">Device Type</label>
					<select
						id="edit_device_type"
						name="device_type"
						required
						bind:value={editingDevice.deviceType}
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
					>
						{#each data.deviceTypes ?? [] as type}
							<option value={type}>{type === 'speaker' ? 'Speaker(s)' : 'Headphones'}</option>
						{/each}
					</select>
				</div>
				<div class="space-y-2">
					<label for="edit_connection_type" class="text-sm font-medium">Connection Type</label>
					<select
						id="edit_connection_type"
						name="connection_type"
						required
						bind:value={editingDevice.connectionType}
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
					>
						{#each data.connectionTypes ?? [] as type}
							<option value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
						{/each}
					</select>
				</div>
				<div class="space-y-2">
					<label for="edit_brand" class="text-sm font-medium">Brand</label>
					<input
						id="edit_brand"
						name="brand"
						type="text"
						required
						bind:value={editingDevice.brand}
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
						placeholder="e.g. Sony, Sennheiser"
					/>
				</div>
				<div class="space-y-2">
					<label for="edit_model" class="text-sm font-medium">Model</label>
					<input
						id="edit_model"
						name="model"
						type="text"
						required
						bind:value={editingDevice.model}
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
						placeholder="e.g. WH-1000XM5"
					/>
				</div>
				<div class="space-y-2">
					<label for="edit_price_tier" class="text-sm font-medium">Price Tier</label>
					<select
						id="edit_price_tier"
						name="price_tier"
						required
						bind:value={editingDevice.priceTier}
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
					>
						{#each data.priceTiers ?? [] as tier}
							<option value={tier}>{tier.charAt(0).toUpperCase() + tier.slice(1)}</option>
						{/each}
					</select>
				</div>
				<Dialog.Footer>
					<Dialog.Close>Cancel</Dialog.Close>
					<button
						type="submit"
						class="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
					>
						Save changes
					</button>
				</Dialog.Footer>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>

<!-- Add device dialog -->
<Dialog.Root bind:open={addDialogOpen}>
	<Dialog.Content class="max-w-md">
		<Dialog.Header>
			<Dialog.Title>Add device</Dialog.Title>
			<Dialog.Description>
				New devices are added as pending and must be approved before users can select them.
			</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/create"
			use:enhance={() => (opts) => handleCreateResult(opts)}
			class="space-y-4"
		>
			<div class="space-y-2">
				<label for="add_device_type" class="text-sm font-medium">Device Type</label>
				<select
					id="add_device_type"
					name="device_type"
					required
					bind:value={newDevice.deviceType}
					class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
				>
					{#each data.deviceTypes ?? [] as type}
						<option value={type}>{type === 'speaker' ? 'Speaker(s)' : 'Headphones'}</option>
					{/each}
				</select>
			</div>
			<div class="space-y-2">
				<label for="add_connection_type" class="text-sm font-medium">Connection Type</label>
				<select
					id="add_connection_type"
					name="connection_type"
					required
					bind:value={newDevice.connectionType}
					class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
				>
					{#each data.connectionTypes ?? [] as type}
						<option value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
					{/each}
				</select>
			</div>
			<div class="space-y-2">
				<label for="add_brand" class="text-sm font-medium">Brand</label>
				<input
					id="add_brand"
					name="brand"
					type="text"
					required
					bind:value={newDevice.brand}
					class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
					placeholder="e.g. Sony, Sennheiser"
				/>
			</div>
			<div class="space-y-2">
				<label for="add_model" class="text-sm font-medium">Model</label>
				<input
					id="add_model"
					name="model"
					type="text"
					required
					bind:value={newDevice.model}
					class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
					placeholder="e.g. WH-1000XM5"
				/>
			</div>
			<div class="space-y-2">
				<label for="add_price_tier" class="text-sm font-medium">Price Tier</label>
				<select
					id="add_price_tier"
					name="price_tier"
					required
					bind:value={newDevice.priceTier}
					class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
				>
					{#each data.priceTiers ?? [] as tier}
						<option value={tier}>{tier.charAt(0).toUpperCase() + tier.slice(1)}</option>
					{/each}
				</select>
			</div>
			<Dialog.Footer>
				<Dialog.Close>Cancel</Dialog.Close>
				<button
					type="submit"
					class="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
				>
					Add device
				</button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
