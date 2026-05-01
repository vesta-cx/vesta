<script lang="ts" module>
	import type { AuthUser } from '@vesta-cx/auth';
</script>

<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '@vesta-cx/ui/components/ui/button';
	import { Input } from '@vesta-cx/ui/components/ui/input';
	import { Label } from '@vesta-cx/ui/components/ui/label';

	type Props = {
		firstName?: string;
		lastName?: string;
		email: string;
	};

	let { firstName = '', lastName = '', email }: Props = $props();

	const initialAccount = () => ({ firstName, lastName, email });
	const initial = initialAccount();
	let firstNameValue = $state(initial.firstName);
	let lastNameValue = $state(initial.lastName);
	let emailValue = $state(initial.email);
	let pendingEmail = $state<string | null>(null);
	let saving = $state(false);
	let saved = $state(false);
	let message = $state<string | null>(null);
	let errors = $state<Record<string, string[] | undefined> | null>(null);

	const fieldError = (key: string) => errors?.[key]?.[0] ?? null;
	const showFailure = (data: unknown) => {
		const payload = data as { errors?: typeof errors; message?: string } | undefined;
		errors = payload?.errors ?? null;
		message = payload?.message ?? null;
	};
	const applyAccount = (account: AuthUser) => {
		firstNameValue = account.firstName ?? '';
		lastNameValue = account.lastName ?? '';
		emailValue = account.email;
	};
</script>

<div class="space-y-6">
	<form
		method="post"
		action="/dashboard?/updateAccount"
		use:enhance={() => {
			saving = true;
			saved = false;
			errors = null;
			message = null;
			return async ({ result, update }) => {
				saving = false;
				if (result.type === 'success') {
					const data = result.data as { account?: AuthUser; pendingEmail?: string } | undefined;
					if (data?.account && !data.pendingEmail) applyAccount(data.account);
					if (data?.pendingEmail) {
						pendingEmail = data.pendingEmail;
						message = `We sent a verification code to ${data.pendingEmail}.`;
					} else {
						pendingEmail = null;
						saved = true;
					}
					await update({ reset: false, invalidateAll: !data?.pendingEmail });
				} else if (result.type === 'failure') {
					showFailure(result.data);
				}
			};
		}}
		class="space-y-6"
	>
		<header class="space-y-1">
			<h2 class="text-lg font-semibold">Account</h2>
			<p class="text-sm text-muted-foreground">
				How we refer to you in communications, billing, and sign-in.
			</p>
		</header>

		<div class="grid gap-4 sm:grid-cols-2">
			<div class="space-y-1.5">
				<Label for="account-first-name">First name</Label>
				<Input
					id="account-first-name"
					name="firstName"
					bind:value={firstNameValue}
					maxlength={80}
					autocomplete="given-name"
				/>
				{#if fieldError('firstName')}
					<p class="text-xs text-destructive">{fieldError('firstName')}</p>
				{/if}
			</div>
			<div class="space-y-1.5">
				<Label for="account-last-name">Last name</Label>
				<Input
					id="account-last-name"
					name="lastName"
					bind:value={lastNameValue}
					maxlength={80}
					autocomplete="family-name"
				/>
				{#if fieldError('lastName')}
					<p class="text-xs text-destructive">{fieldError('lastName')}</p>
				{/if}
			</div>
		</div>

		<div class="space-y-1.5">
			<Label for="account-email">Email</Label>
			<Input
				id="account-email"
				name="email"
				type="email"
				bind:value={emailValue}
				maxlength={254}
				autocomplete="email"
				required
			/>
			{#if fieldError('email')}
				<p class="text-xs text-destructive">{fieldError('email')}</p>
			{/if}
			<p class="text-xs text-muted-foreground">
				Changing email sends a code to the new address before it becomes your sign-in email.
			</p>
		</div>

		{#if message && !fieldError('code')}
			<p class="text-sm" class:text-destructive={!pendingEmail} class:text-muted-foreground={!!pendingEmail}>
				{message}
			</p>
		{/if}

		<div class="flex items-center justify-between gap-3">
			{#if saved}
				<span class="text-xs text-muted-foreground">Saved</span>
			{:else}
				<span></span>
			{/if}
			<Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save account'}</Button>
		</div>
	</form>

	{#if pendingEmail}
		<form
			method="post"
			action="/dashboard?/confirmEmailChange"
			use:enhance={() => {
				saving = true;
				errors = null;
				return async ({ result, update }) => {
					saving = false;
					if (result.type === 'success') {
						const data = result.data as { account?: AuthUser } | undefined;
						if (data?.account) applyAccount(data.account);
						pendingEmail = null;
						message = null;
						saved = true;
						await update({ reset: true, invalidateAll: true });
					} else if (result.type === 'failure') {
						showFailure(result.data);
					}
				};
			}}
			class="space-y-3 rounded-md border p-3"
		>
			<div class="space-y-1">
				<p class="text-sm font-medium">Verify {pendingEmail}</p>
				<p class="text-xs text-muted-foreground">
					Enter the 6-digit code we sent to finish changing your sign-in email.
				</p>
			</div>
			<div class="space-y-1.5">
				<Label for="account-email-code">Verification code</Label>
				<div class="flex gap-2">
					<Input
						id="account-email-code"
						name="code"
						inputmode="numeric"
						autocomplete="one-time-code"
						placeholder="123456"
						required
					/>
					<Button type="submit" disabled={saving}>{saving ? 'Verifying…' : 'Verify email'}</Button>
				</div>
				{#if fieldError('code')}
					<p class="text-xs text-destructive">{fieldError('code')}</p>
				{/if}
			</div>
		</form>
	{/if}
</div>
