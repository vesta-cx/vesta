<script lang="ts">
	import { Button } from '@vesta-cx/ui/components/ui/button';
	import { Input } from '@vesta-cx/ui/components/ui/input';
	import { Label } from '@vesta-cx/ui/components/ui/label';
	import { Separator } from '@vesta-cx/ui/components/ui/separator';
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
		<p class="text-sm text-muted-foreground">
			Manage your WorkOS profile, sign-in details, and authentication.
		</p>
	</header>

	<Separator />

	<section class="space-y-4">
		<header class="space-y-0.5">
			<h3 class="text-sm font-medium">Profile</h3>
			<p class="text-xs text-muted-foreground">Your name as it appears on Vesta.</p>
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
	</section>

	<Separator />

	<section class="space-y-4">
		<header class="space-y-0.5">
			<h3 class="text-sm font-medium">Email</h3>
			<p class="text-xs text-muted-foreground">
				Used to sign in. Updating sends a verification email.
			</p>
		</header>
		<div class="space-y-1.5">
			<Label for="account-email">Email address</Label>
			<Input
				id="account-email"
				type="email"
				value={email}
				disabled
				title={IN_DEVELOPMENT_TOOLTIP}
			/>
		</div>
	</section>

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
		<Button variant="outline" disabled title={IN_DEVELOPMENT_TOOLTIP}>
			Enable 2FA
		</Button>
	</section>
</div>
