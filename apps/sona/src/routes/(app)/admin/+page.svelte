<script lang="ts">
	import { pageTitle } from '$lib/constants/identity';

	let { data } = $props();
</script>

<svelte:head>
	<title>{pageTitle('Admin Dashboard')}</title>
</svelte:head>

<div class="space-y-6">
	<h1 class="text-2xl font-bold">Admin Dashboard</h1>
	<p class="text-muted-foreground">
		Welcome back, {data.session?.email}. Use the sidebar to manage the survey.
	</p>

	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<a
			href="/admin/devices"
			class="rounded-xl border bg-card p-6 transition-colors hover:bg-muted/50"
		>
			<h3 class="font-medium">Devices</h3>
			<p class="mt-1 text-sm text-muted-foreground">Manage listening devices</p>
		</a>
		<a
			href="/admin/sources"
			class="rounded-xl border bg-card p-6 transition-colors hover:bg-muted/50"
		>
			<h3 class="font-medium">Sources</h3>
			<p class="mt-1 text-sm text-muted-foreground">Upload and manage audio files</p>
		</a>
		<a
			href="/admin/quality-options"
			class="rounded-xl border bg-card p-6 transition-colors hover:bg-muted/50"
		>
			<h3 class="font-medium">Quality Options</h3>
			<p class="mt-1 text-sm text-muted-foreground">Toggle codec+bitrate permutations</p>
		</a>
		<a
			href="/admin/snapshots"
			class="rounded-xl border bg-card p-6 transition-colors hover:bg-muted/50"
		>
			<h3 class="font-medium">Snapshots</h3>
			<p class="mt-1 text-sm text-muted-foreground">View results and trigger snapshots</p>
		</a>
		<a
			href="/admin/storage"
			class="rounded-xl border bg-card p-6 transition-colors hover:bg-muted/50"
		>
			<h3 class="font-medium">R2 Storage</h3>
			<p class="mt-1 text-sm text-muted-foreground">Inspect object keys in the audio bucket</p>
		</a>
	</div>
</div>
