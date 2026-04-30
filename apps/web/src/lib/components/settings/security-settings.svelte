<script lang="ts">
	import { Button } from '@vesta-cx/ui/components/ui/button';
	import { IN_DEVELOPMENT_TOOLTIP } from '$lib/components/dashboard/nav-collapsible.svelte';
	import ActionRow from './action-row.svelte';
</script>

<div class="space-y-6">
	<header class="space-y-1">
		<h2 class="text-lg font-semibold">Security</h2>
		<p class="text-sm text-muted-foreground">Sign-in and authentication.</p>
	</header>

	<ul class="divide-y">
		<ActionRow title="Password" description="Sends a password reset email.">
			{#snippet action()}
				<Button variant="outline" size="sm" disabled title={IN_DEVELOPMENT_TOOLTIP}>
					Reset
				</Button>
			{/snippet}
		</ActionRow>

		<ActionRow
			title="Two-factor authentication"
			description="Adds an extra step when signing in. Not enabled."
		>
			{#snippet action()}
				<Button variant="outline" size="sm" disabled title={IN_DEVELOPMENT_TOOLTIP}>
					Enable
				</Button>
			{/snippet}
		</ActionRow>

		<ActionRow
			title="Active sessions"
			description="Sign out of any devices you don't recognize."
		>
			{#snippet action()}
				<Button variant="outline" size="sm" disabled title={IN_DEVELOPMENT_TOOLTIP}>
					Sign out others
				</Button>
			{/snippet}
		</ActionRow>
	</ul>
</div>
