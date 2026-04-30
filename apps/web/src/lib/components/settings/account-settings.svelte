<script lang="ts">
	import { Input } from '@vesta-cx/ui/components/ui/input';
	import { Label } from '@vesta-cx/ui/components/ui/label';
	import { IN_DEVELOPMENT_TOOLTIP } from '$lib/components/dashboard/nav-collapsible.svelte';

	type Props = {
		firstName?: string;
		lastName?: string;
		email: string;
	};

	let { firstName = '', lastName = '', email }: Props = $props();
</script>

<div class="space-y-6">
	<header class="space-y-1">
		<h2 class="text-lg font-semibold">Account</h2>
		<p class="text-sm text-muted-foreground">Your legal identity. Managed via WorkOS.</p>
	</header>

	<div class="grid gap-4 sm:grid-cols-2">
		<div class="space-y-1.5">
			<Label for="account-first-name">First name</Label>
			<Input
				id="account-first-name"
				value={firstName}
				disabled
				title={IN_DEVELOPMENT_TOOLTIP}
			/>
		</div>
		<div class="space-y-1.5">
			<Label for="account-last-name">Last name</Label>
			<Input
				id="account-last-name"
				value={lastName}
				disabled
				title={IN_DEVELOPMENT_TOOLTIP}
			/>
		</div>
	</div>

	<div class="space-y-1.5">
		<Label for="account-email">Email</Label>
		<Input
			id="account-email"
			type="email"
			value={email}
			disabled
			title={IN_DEVELOPMENT_TOOLTIP}
		/>
	</div>
</div>
