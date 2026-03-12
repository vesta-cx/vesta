<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Dialog from '@vesta-cx/ui/components/ui/dialog';
	import { Button } from '@vesta-cx/ui/components/ui/button';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { toast } from 'svelte-sonner';

	let { data, form } = $props();

	let addDialogOpen = $state(false);
	let editDialogOpen = $state(false);
	let newMessage = $state('');
	let editingMessage = $state<{ id: string; message: string } | null>(null);

	const handleCreateResult = (opts: {
		result?: { type?: string; data?: { success?: boolean } };
		update?: (options?: { reset?: boolean }) => Promise<void>;
	}) => {
		if (opts?.result?.type === 'success' && opts?.result?.data?.success) {
			toast.success('Easter egg added');
			addDialogOpen = false;
			newMessage = '';
		}
		opts?.update?.({ reset: false });
	};

	const handleUpdateResult = (opts: {
		result?: { type?: string; data?: { success?: boolean } };
		update?: (options?: { reset?: boolean }) => Promise<void>;
	}) => {
		if (opts?.result?.type === 'success' && opts?.result?.data?.success) {
			toast.success('Easter egg updated');
			editDialogOpen = false;
			editingMessage = null;
		}
		opts?.update?.({ reset: false });
	};

	const handleDeleteResult = (opts: {
		result?: { type?: string; data?: { success?: boolean } };
		update?: () => Promise<void>;
	}) => {
		if (opts?.result?.type === 'success' && opts?.result?.data?.success) {
			toast.success('Easter egg deleted');
		}
		opts?.update?.();
	};

	const handleSeedResult = (opts: {
		result?: { type?: string; data?: { message?: string } };
		update?: () => Promise<void>;
	}) => {
		if (opts?.result?.type === 'success' && opts?.result?.data?.message) {
			toast.success(opts.result.data.message);
		}
		opts?.update?.();
	};

	const openEdit = (msg: (typeof data.messages)[number]) => {
		editingMessage = { id: msg.id, message: msg.message };
		editDialogOpen = true;
	};
</script>

<svelte:head>
	<title>Easter Eggs | Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-wrap items-center justify-between gap-4">
		<h1 class="text-2xl font-bold">Easter Eggs</h1>
		<div class="flex items-center gap-2">
			<form method="POST" action="?/seed" use:enhance={() => (opts) => handleSeedResult(opts)}>
				<button
					type="submit"
					class="rounded-lg bg-muted px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/80"
				>
					Seed defaults
				</button>
			</form>
			<Button type="button" size="sm" onclick={() => (addDialogOpen = true)}>
				<Plus class="size-4" aria-hidden="true" />
				Add message
			</Button>
		</div>
	</div>

	<p class="text-sm text-muted-foreground">
		Short messages shown in the round summary at randomized intervals (~every 17–23 rounds). One is
		picked at random from this list when a user hits an easter-egg round.
	</p>

	{#if form?.error}
		<div
			class="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
		>
			{form.error}
		</div>
	{/if}

	{#if data.messages.length === 0}
		<p class="py-12 text-center text-sm text-muted-foreground">
			No easter egg messages yet. Click "Seed defaults" to add a starter set, or "Add message" to
			create one.
		</p>
	{:else}
		<div class="rounded-lg border">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b bg-muted/50">
						<th class="px-4 py-2 text-left font-medium">Message</th>
						<th class="w-24 px-4 py-2 text-right font-medium">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each data.messages as msg}
						<tr class="border-b last:border-0">
							<td class="px-4 py-3">{msg.message}</td>
							<td class="px-4 py-3">
								<div class="flex items-center justify-end gap-2">
									<button
										type="button"
										class="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
										onclick={() => openEdit(msg)}
									>
										<Pencil class="size-3.5" aria-hidden="true" />
										Edit
									</button>
									<form
										method="POST"
										action="?/delete"
										use:enhance={() => (opts) => handleDeleteResult(opts)}
										class="inline"
									>
										<input type="hidden" name="id" value={msg.id} />
										<button
											type="submit"
											class="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive hover:underline"
											onclick={(e) => {
												if (!confirm('Delete this easter egg message?')) e.preventDefault();
											}}
										>
											<Trash2 class="size-3.5" aria-hidden="true" />
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
	{/if}
</div>

<!-- Add dialog -->
<Dialog.Root bind:open={addDialogOpen} onOpenChange={(v) => !v && (newMessage = '')}>
	<Dialog.Content class="max-w-md">
		<Dialog.Header>
			<Dialog.Title>Add easter egg</Dialog.Title>
			<Dialog.Description>
				Short, fun message shown to users at random intervals during the survey.
			</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/create"
			use:enhance={() => (opts) => handleCreateResult(opts)}
			class="space-y-4"
		>
			<div class="space-y-2">
				<label for="add_message" class="text-sm font-medium">Message</label>
				<input
					id="add_message"
					name="message"
					type="text"
					required
					bind:value={newMessage}
					class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
					placeholder="e.g. good data... yum"
				/>
			</div>
			<Dialog.Footer>
				<Dialog.Close>Cancel</Dialog.Close>
				<button
					type="submit"
					class="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
				>
					Add
				</button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Edit dialog -->
<Dialog.Root bind:open={editDialogOpen} onOpenChange={(v) => !v && (editingMessage = null)}>
	<Dialog.Content class="max-w-md">
		<Dialog.Header>
			<Dialog.Title>Edit easter egg</Dialog.Title>
			<Dialog.Description>Update the message shown to users.</Dialog.Description>
		</Dialog.Header>
		{#if editingMessage}
			<form
				method="POST"
				action="?/update"
				use:enhance={() => (opts) => handleUpdateResult(opts)}
				class="space-y-4"
			>
				<input type="hidden" name="id" value={editingMessage.id} />
				<div class="space-y-2">
					<label for="edit_message" class="text-sm font-medium">Message</label>
					<input
						id="edit_message"
						name="message"
						type="text"
						required
						bind:value={editingMessage.message}
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
						placeholder="e.g. good data... yum"
					/>
				</div>
				<Dialog.Footer>
					<Dialog.Close>Cancel</Dialog.Close>
					<button
						type="submit"
						class="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
					>
						Save
					</button>
				</Dialog.Footer>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>
