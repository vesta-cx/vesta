<script lang="ts">
	import { page } from '$app/state';
	import { pageTitle } from '$lib/constants/identity';
	import { Button } from '@vesta-cx/ui/components/ui/button';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '@vesta-cx/ui/components/ui/table';
	import DatabaseIcon from '@lucide/svelte/icons/database';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

	let { data } = $props();

	const prefixOptions = [
		{ value: '', label: 'All objects' },
		{ value: 'sources/', label: 'sources/' },
		{ value: 'candidates/', label: 'candidates/' }
	];

	const currentPrefix = $derived(page.url.searchParams.get('prefix') ?? '');
	const loadMoreUrl = $derived.by(() => {
		const u = new URL('/admin/storage', page.url.origin);
		if (currentPrefix) u.searchParams.set('prefix', currentPrefix);
		if (data.cursor) u.searchParams.set('cursor', data.cursor);
		return u.toString();
	});

	const prefixUrl = (prefix: string): string => {
		const u = new URL(page.url);
		if (prefix) u.searchParams.set('prefix', prefix);
		else u.searchParams.delete('prefix');
		u.searchParams.delete('cursor');
		return u.toString();
	};

	const formatBytes = (bytes: number): string => {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	};

	const formatDate = (d: Date): string =>
		new Date(d).toLocaleString(undefined, {
			dateStyle: 'short',
			timeStyle: 'short'
		});
</script>

<svelte:head>
	<title>{pageTitle('R2 Storage | Admin')}</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold">R2 Storage</h1>
			<p class="text-sm text-muted-foreground">
				Inspect object keys in the audio bucket. Keys are now filename-based (e.g.
				<code class="rounded bg-muted px-1 py-0.5">sources/songname_abc12345.flac</code>,
				<code class="rounded bg-muted px-1 py-0.5">candidates/{'{id}'}/songname_opus_128.opus</code
				>).
			</p>
		</div>
	</div>

	<div class="flex items-center gap-2">
		<span class="text-sm text-muted-foreground">Prefix:</span>
		<div class="flex gap-1">
			{#each prefixOptions as opt}
				<a
					href={prefixUrl(opt.value)}
					class="rounded-md border px-3 py-1.5 text-sm transition-colors {currentPrefix ===
					opt.value
						? 'border-primary bg-primary text-primary-foreground'
						: 'border-input bg-transparent hover:bg-muted'}"
				>
					{opt.label}
				</a>
			{/each}
		</div>
	</div>

	<div class="rounded-lg border">
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Key</TableHead>
					<TableHead class="text-right">Size</TableHead>
					<TableHead class="text-right">Uploaded</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#if data.objects.length === 0}
					<TableRow>
						<TableCell colspan={3} class="py-8 text-center text-muted-foreground">
							<DatabaseIcon class="mx-auto mb-2 size-8 opacity-50" />
							<p>No objects found.</p>
							{#if currentPrefix}
								<p class="text-sm">Try a different prefix or "All objects".</p>
							{/if}
						</TableCell>
					</TableRow>
				{:else}
					{#each data.objects as obj}
						<TableRow>
							<TableCell class="font-mono text-sm break-all">{obj.key}</TableCell>
							<TableCell class="text-right tabular-nums">{formatBytes(obj.size)}</TableCell>
							<TableCell class="text-right text-muted-foreground tabular-nums">
								{formatDate(obj.uploaded)}
							</TableCell>
						</TableRow>
					{/each}
				{/if}
			</TableBody>
		</Table>
	</div>

	{#if data.truncated && data.cursor}
		<div class="flex justify-center">
			<a href={loadMoreUrl}>
				<Button variant="outline">
					Load more
					<ChevronRightIcon class="ms-1 size-4" />
				</Button>
			</a>
		</div>
	{/if}
</div>
