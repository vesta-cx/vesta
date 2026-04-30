<script lang="ts">
	import { Button } from '@vesta-cx/ui/components/ui/button';
	import { Separator } from '@vesta-cx/ui/components/ui/separator';
	import { IN_DEVELOPMENT_TOOLTIP } from '$lib/components/dashboard/nav-collapsible.svelte';
</script>

<div class="space-y-6">
	<header class="space-y-1">
		<h2 class="text-lg font-semibold">Security</h2>
		<p class="text-sm text-muted-foreground">
			Sign-in, multi-factor authentication, and active sessions. Backed by WorkOS.
		</p>
	</header>

	<Separator />

	<section class="space-y-4">
		<header class="space-y-0.5">
			<h3 class="text-sm font-medium">Password</h3>
			<p class="text-xs text-muted-foreground">
				Sends a password reset email through WorkOS.
			</p>
		</header>
		<Button variant="outline" disabled title={IN_DEVELOPMENT_TOOLTIP}>
			Send password reset
		</Button>
	</section>

	<Separator />

	<section class="space-y-4">
		<header class="flex items-end justify-between gap-4">
			<div class="space-y-0.5">
				<h3 class="text-sm font-medium">Two-factor authentication</h3>
				<p class="text-xs text-muted-foreground">Adds an extra step when signing in.</p>
			</div>
			<span class="text-xs text-muted-foreground">Not enabled</span>
		</header>
		<Button variant="outline" disabled title={IN_DEVELOPMENT_TOOLTIP}>Enable 2FA</Button>
	</section>

	<Separator />

	<section class="space-y-4">
		<header class="space-y-0.5">
			<h3 class="text-sm font-medium">Active sessions</h3>
			<p class="text-xs text-muted-foreground">
				Sign out of any devices you don't recognize.
			</p>
		</header>
		<Button variant="outline" disabled title={IN_DEVELOPMENT_TOOLTIP}>
			Sign out other sessions
		</Button>
	</section>
</div>
