<script lang="ts">
	import { Button } from '@vesta-cx/ui/components/ui/button';
	import { Separator } from '@vesta-cx/ui/components/ui/separator';
	import { IN_DEVELOPMENT_TOOLTIP } from '$lib/components/dashboard/nav-collapsible.svelte';
</script>

<div class="space-y-6">
	<header class="space-y-1">
		<h2 class="text-lg font-semibold">Data &amp; privacy</h2>
		<p class="text-sm text-muted-foreground">
			Controls for the data Vesta holds about you. GDPR-aligned: export, rectify, restrict,
			delete.
		</p>
	</header>

	<Separator />

	<section class="space-y-4">
		<header class="space-y-0.5">
			<h3 class="text-sm font-medium">Export your data</h3>
			<p class="text-xs text-muted-foreground">
				Download a portable archive of your account, profile, resources, and engagement
				history.
			</p>
		</header>
		<Button variant="outline" disabled title={IN_DEVELOPMENT_TOOLTIP}>
			Request data export
		</Button>
	</section>

	<Separator />

	<section class="space-y-4">
		<header class="space-y-0.5">
			<h3 class="text-sm font-medium">Processing log</h3>
			<p class="text-xs text-muted-foreground">
				A record of how Vesta has accessed or shared your data.
			</p>
		</header>
		<Button variant="outline" disabled title={IN_DEVELOPMENT_TOOLTIP}>View processing log</Button>
	</section>

	<Separator />

	<section class="space-y-4">
		<header class="space-y-0.5">
			<h3 class="text-sm font-medium">Analytics &amp; product telemetry</h3>
			<p class="text-xs text-muted-foreground">
				Allow Vesta to use de-identified product usage to improve the platform.
			</p>
		</header>
		<Button variant="outline" disabled title={IN_DEVELOPMENT_TOOLTIP}>
			Manage data sharing
		</Button>
	</section>

	<Separator />

	<section class="space-y-4">
		<header class="space-y-0.5">
			<h3 class="text-sm font-medium text-destructive">Delete your account</h3>
			<p class="text-xs text-muted-foreground">
				Permanently delete your Vesta account and all associated personal data. This
				action cannot be undone.
			</p>
		</header>
		<Button variant="outline" disabled title={IN_DEVELOPMENT_TOOLTIP}>
			Request account deletion
		</Button>
	</section>
</div>
