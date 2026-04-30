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
</script>

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
				const data = result.data as { account?: AuthUser } | undefined;
				if (data?.account) {
					firstNameValue = data.account.firstName ?? '';
					lastNameValue = data.account.lastName ?? '';
					emailValue = data.account.email;
				}
				saved = true;
				await update({ reset: false, invalidateAll: true });
			} else if (result.type === 'failure') {
				showFailure(result.data);
			}
		};
	}}
	class="space-y-6"
>
	<header class="space-y-1">
		<h2 class="text-lg font-semibold">Account</h2>
		<p class="text-sm text-muted-foreground">Your WorkOS legal identity and sign-in email.</p>
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
			Changing email may require verification before it is trusted for sign-in.
		</p>
	</div>

	{#if message}
		<p class="text-sm text-destructive">{message}</p>
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
