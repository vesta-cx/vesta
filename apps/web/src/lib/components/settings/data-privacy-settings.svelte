<script lang="ts">
	import { Button } from '@vesta-cx/ui/components/ui/button';
	import SettingsHeading from './settings-heading.svelte';
	import { IN_DEVELOPMENT_TOOLTIP } from '$lib/components/dashboard/nav-collapsible.svelte';
	import ActionRow from './action-row.svelte';
</script>

<div class="space-y-6">
	<SettingsHeading
		section="Data & privacy"
		title="Data & privacy"
		description="GDPR controls: export, rectify, restrict, delete."
	/>

	<ul class="divide-y">
		<ActionRow
			title="Export your data"
			description="Download an archive of your account, profile, resources, and engagements."
		>
			{#snippet action()}
				<Button variant="outline" size="sm" disabled title={IN_DEVELOPMENT_TOOLTIP}>
					Request
				</Button>
			{/snippet}
		</ActionRow>

		<ActionRow
			title="Processing log"
			description="A record of how Vesta has accessed or shared your data."
		>
			{#snippet action()}
				<Button variant="outline" size="sm" disabled title={IN_DEVELOPMENT_TOOLTIP}>
					View
				</Button>
			{/snippet}
		</ActionRow>

		<ActionRow
			title="Analytics & telemetry"
			description="Allow Vesta to use de-identified product usage to improve the platform."
		>
			{#snippet action()}
				<Button variant="outline" size="sm" disabled title={IN_DEVELOPMENT_TOOLTIP}>
					Manage
				</Button>
			{/snippet}
		</ActionRow>

		<ActionRow
			title="Delete account"
			description="Permanently delete your Vesta account and all associated personal data."
			danger
		>
			{#snippet action()}
				<Button variant="outline" size="sm" disabled title={IN_DEVELOPMENT_TOOLTIP}>
					Request
				</Button>
			{/snippet}
		</ActionRow>
	</ul>
</div>
