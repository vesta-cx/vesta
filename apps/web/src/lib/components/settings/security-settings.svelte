<script lang="ts" module>
	import type { AuthFactor, AuthTotpEnrollment, AuthUserSession } from '@vesta-cx/auth';

	export type SecuritySettingsData = {
		unavailable: boolean;
		authFactors: AuthFactor[];
		sessions: AuthUserSession[];
		currentSessionId: string | null;
	};
</script>

<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '@vesta-cx/ui/components/ui/button';
	import { Input } from '@vesta-cx/ui/components/ui/input';
	import { Label } from '@vesta-cx/ui/components/ui/label';
	import ActionRow from './action-row.svelte';
	import SettingsHeading from './settings-heading.svelte';

	let {
		security,
		email,
		emailVerified
	}: {
		security: SecuritySettingsData;
		email: string;
		emailVerified: boolean;
	} = $props();

	type SecurityMode = 'overview' | 'password' | 'totp' | 'passkeys' | 'sessions';

	let mode = $state<SecurityMode>('overview');
	let saving = $state(false);
	let saved = $state(false);
	let busyFactorId = $state<string | null>(null);
	let busySessionId = $state<string | null>(null);
	let enrollment = $state<AuthTotpEnrollment | null>(null);
	let message = $state<string | null>(null);
	let errors = $state<Record<string, string[] | undefined> | null>(null);

	const totpFactors = $derived(security.authFactors.filter((factor) => factor.type === 'totp'));
	const hasTotp = $derived(totpFactors.length > 0);
	const activeSessions = $derived(security.sessions.filter((session) => session.status === 'active'));
	const otherActiveSessions = $derived(
		activeSessions.filter((session) => session.id !== security.currentSessionId)
	);

	const urlModeMap: Record<string, SecurityMode> = {
		password: 'password',
		'authenticator-app': 'totp',
		passkeys: 'passkeys',
		sessions: 'sessions'
	};
	const modeUrlMap: Record<SecurityMode, string> = {
		overview: '/dashboard/settings/security',
		password: '/dashboard/settings/security/password',
		totp: '/dashboard/settings/security/authenticator-app',
		passkeys: '/dashboard/settings/security/passkeys',
		sessions: '/dashboard/settings/security/sessions'
	};
	$effect(() => {
		const [, settingsRoot, category, panel] = page.url.pathname.split('/').filter(Boolean);
		if (settingsRoot === 'settings' && category === 'security') {
			mode = panel ? (urlModeMap[panel] ?? 'overview') : 'overview';
		}
	});

	const setMode = async (nextMode: SecurityMode) => {
		mode = nextMode;
		await goto(modeUrlMap[nextMode], { keepFocus: true, noScroll: true });
	};

	const fieldError = (key: string) => errors?.[key]?.[0] ?? null;
	const formatSessionDate = (value: string) =>
		new Intl.DateTimeFormat(undefined, {
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(new Date(value));
	const describeSession = (session: AuthUserSession) =>
		[session.userAgent ?? 'Unknown device', session.ipAddress].filter(Boolean).join(' · ');
	const resetPasswordForm = () => {
		saving = false;
		errors = null;
		message = null;
	};
	const showFailure = (data: unknown) => {
		const payload = data as { errors?: typeof errors; message?: string } | undefined;
		errors = payload?.errors ?? null;
		message = payload?.message ?? null;
	};
</script>

{#if mode === 'password'}
	<form
		method="post"
		action="/dashboard?/changePassword"
		use:enhance={() => {
			saving = true;
			saved = false;
			errors = null;
			message = null;
			return async ({ result, update }) => {
				saving = false;
				if (result.type === 'success') {
					saved = true;
					void setMode('overview');
					await update({ reset: true, invalidateAll: false });
				} else if (result.type === 'failure') {
					showFailure(result.data);
				}
			};
		}}
		class="space-y-6"
	>
		<SettingsHeading
			section="Security"
			title="Change password"
			description="Enter your current password before choosing a new one."
		/>

		<div class="space-y-1.5">
			<Label for="security-current-password">Current password</Label>
			<Input
				id="security-current-password"
				name="currentPassword"
				type="password"
				autocomplete="current-password"
				required
			/>
			{#if fieldError('currentPassword')}
				<p class="text-xs text-destructive">{fieldError('currentPassword')}</p>
			{/if}
		</div>

		<div class="space-y-1.5">
			<Label for="security-new-password">New password</Label>
			<Input
				id="security-new-password"
				name="newPassword"
				type="password"
				autocomplete="new-password"
				minlength={8}
				maxlength={72}
				required
			/>
			{#if fieldError('newPassword')}
				<p class="text-xs text-destructive">{fieldError('newPassword')}</p>
			{/if}
		</div>

		<div class="space-y-1.5">
			<Label for="security-confirm-password">Confirm new password</Label>
			<Input
				id="security-confirm-password"
				name="confirmPassword"
				type="password"
				autocomplete="new-password"
				required
			/>
			{#if fieldError('confirmPassword')}
				<p class="text-xs text-destructive">{fieldError('confirmPassword')}</p>
			{/if}
		</div>

		{#if message}
			<p class="text-sm text-destructive">{message}</p>
		{/if}

		<div class="flex items-center justify-between gap-3">
			<Button
				type="button"
				variant="ghost"
				onclick={() => {
					resetPasswordForm();
					void setMode('overview');
				}}
			>
				Cancel
			</Button>
			<Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save password'}</Button>
		</div>
	</form>
{:else if mode === 'totp'}
	<div class="space-y-6">
		<SettingsHeading
			section="Security"
			title="Authenticator app"
			description="Set up or replace the one-time password app stored in WorkOS."
		/>

		{#if security.unavailable}
			<p class="text-sm text-destructive">Security methods are temporarily unavailable.</p>
		{:else}
			<div class="space-y-3">
				{#if totpFactors.length === 0}
					<p class="text-sm text-muted-foreground">No authenticator app is set up.</p>
				{:else}
					<p class="text-sm text-muted-foreground">
						Your authenticator app is set up. Run setup again to replace it.
					</p>
					<ul class="divide-y rounded-md border">
						{#each totpFactors as factor (factor.id)}
							<li class="flex items-center justify-between gap-3 px-3 py-2.5">
								<div class="min-w-0">
									<p class="truncate text-sm font-medium">{factor.totp.issuer}</p>
									<p class="truncate text-xs text-muted-foreground">{factor.totp.user}</p>
								</div>
								<form
									method="post"
									action="/dashboard?/deleteAuthFactor"
									use:enhance={() => {
										busyFactorId = factor.id;
										message = null;
										return async ({ result, update }) => {
											busyFactorId = null;
											if (result.type === 'success') {
												await update({ reset: true, invalidateAll: true });
											} else if (result.type === 'failure') {
												showFailure(result.data);
											}
										};
									}}
								>
									<input type="hidden" name="factorId" value={factor.id} />
									<Button type="submit" variant="outline" size="sm" disabled={busyFactorId === factor.id}>
										{busyFactorId === factor.id ? 'Removing…' : 'Remove'}
									</Button>
								</form>
							</li>
						{/each}
					</ul>
				{/if}
			</div>

			{#if enrollment}
				<div class="space-y-3 rounded-md border p-3">
					<div>
						<p class="text-sm font-medium">Finish setup in your authenticator app</p>
						<p class="text-xs text-muted-foreground">
							Scan the QR code or enter the secret manually.
						</p>
					</div>
					{#if enrollment.factor.totp.qrCode}
						<img
							src={enrollment.factor.totp.qrCode}
							alt="Authenticator app setup QR code"
							class="size-36 rounded-md border bg-white p-2"
						/>
					{/if}
					{#if enrollment.factor.totp.secret}
						<code class="block break-all rounded bg-muted px-2 py-1 text-xs">
							{enrollment.factor.totp.secret}
						</code>
					{/if}
					<form
						method="post"
						action="/dashboard?/verifyTotpEnrollment"
						use:enhance={() => {
							saving = true;
							errors = null;
							message = null;
							return async ({ result, update }) => {
								saving = false;
								if (result.type === 'success') {
									enrollment = null;
									await update({ reset: true, invalidateAll: true });
								} else if (result.type === 'failure') {
									console.error('[security-settings] TOTP verification failed', result.data);
									showFailure(result.data);
								}
							};
						}}
						class="space-y-2"
					>
						<input type="hidden" name="factorId" value={enrollment.factor.id} />
						<input type="hidden" name="challengeId" value={enrollment.challenge.id} />
						<Label for="security-totp-code">Verification code</Label>
						<div class="flex gap-2">
							<Input
								id="security-totp-code"
								name="code"
								inputmode="numeric"
								autocomplete="one-time-code"
								placeholder="123456"
								required
							/>
							<Button type="submit" disabled={saving}>{saving ? 'Verifying…' : 'Verify'}</Button>
						</div>
						{#if fieldError('code')}
							<p class="text-xs text-destructive">{fieldError('code')}</p>
						{/if}
					</form>
				</div>
			{/if}

			{#if message}
				<p class="text-sm text-destructive">{message}</p>
			{/if}

			<div class="flex items-center justify-between gap-3">
				<Button type="button" variant="ghost" onclick={() => void setMode('overview')}>Back</Button>
				<form
					method="post"
					action="/dashboard?/enrollTotp"
					use:enhance={() => {
						saving = true;
						message = null;
						return async ({ result, update }) => {
							saving = false;
							if (result.type === 'success') {
								const data = result.data as { enrollment?: AuthTotpEnrollment } | undefined;
								enrollment = data?.enrollment ?? null;
								await update({ reset: true, invalidateAll: true });
							} else if (result.type === 'failure') {
								showFailure(result.data);
							}
						};
					}}
				>
					<Button type="submit" disabled={saving}>{saving ? 'Starting…' : 'Set up authenticator'}</Button>
				</form>
			</div>
		{/if}
	</div>
{:else if mode === 'sessions'}
	<div class="space-y-6">
		<SettingsHeading
			section="Security"
			title="Sessions"
			description="Review active sign-ins and revoke any devices you don't recognize."
		/>

		{#if message}
			<p class="text-sm text-destructive">{message}</p>
		{/if}

		<div class="space-y-3">
			{#each activeSessions as session (session.id)}
				<div class="flex items-start justify-between gap-4 border-b pb-3 last:border-b-0">
					<div class="min-w-0 space-y-1">
						<div class="flex flex-wrap items-center gap-2">
							<p class="text-sm font-medium">
								{session.id === security.currentSessionId ? 'Current session' : 'Active session'}
							</p>
							{#if session.id === security.currentSessionId}
								<span class="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] text-muted-foreground">
									This device
								</span>
							{/if}
						</div>
						<p class="break-words text-xs text-muted-foreground">{describeSession(session)}</p>
						<p class="text-xs text-muted-foreground">
							Signed in with {session.authMethod.replaceAll('_', ' ')} · Expires {formatSessionDate(
								session.expiresAt
							)}
						</p>
					</div>
					{#if session.id !== security.currentSessionId}
						<form
							method="post"
							action="/dashboard?/revokeSession"
							use:enhance={() => {
								busySessionId = session.id;
								message = null;
								return async ({ result, update }) => {
									busySessionId = null;
									if (result.type === 'success') {
										await update({ reset: true, invalidateAll: true });
									} else if (result.type === 'failure') {
										showFailure(result.data);
									}
								};
							}}
						>
							<input type="hidden" name="sessionId" value={session.id} />
							<Button type="submit" variant="outline" size="sm" disabled={busySessionId === session.id}>
								{busySessionId === session.id ? 'Revoking…' : 'Revoke'}
							</Button>
						</form>
					{/if}
				</div>
			{:else}
				<p class="text-sm text-muted-foreground">No active sessions found.</p>
			{/each}
		</div>

		<div class="flex items-center justify-between gap-3">
			<Button type="button" variant="ghost" onclick={() => void setMode('overview')}>Back</Button>
			<form
				method="post"
				action="/dashboard?/revokeOtherSessions"
				use:enhance={() => {
					saving = true;
					message = null;
					return async ({ result, update }) => {
						saving = false;
						if (result.type === 'success') {
							await update({ reset: true, invalidateAll: true });
						} else if (result.type === 'failure') {
							showFailure(result.data);
						}
					};
				}}
			>
				<Button type="submit" variant="outline" disabled={saving || otherActiveSessions.length === 0}>
					{saving ? 'Revoking…' : 'Revoke all others'}
				</Button>
			</form>
		</div>
	</div>
{:else if mode === 'passkeys'}
	<div class="space-y-6">
		<SettingsHeading
			section="Security"
			title="Passkeys"
			description="WorkOS currently exposes passkey enrollment through hosted AuthKit only."
		/>

		<div class="rounded-md border p-3 text-sm text-muted-foreground">
			Passkeys count as a first and second factor when AuthKit verifies user presence, but the
			WorkOS API does not expose custom passkey listing, deletion, or enrollment endpoints yet.
		</div>

		<div class="flex justify-start">
			<Button type="button" variant="ghost" onclick={() => void setMode('overview')}>Back</Button>
		</div>
	</div>
{:else}
	<div class="space-y-6">
		<SettingsHeading section="Security" title="Security" description="Sign-in and authentication." />

		<ul class="divide-y">
			<ActionRow title="Password" description="Change the password used for email sign-in.">
				{#snippet action()}
					<div class="flex items-center gap-3">
						{#if saved}
							<span class="text-xs text-muted-foreground">Saved</span>
						{/if}
						<Button
							variant="outline"
							size="sm"
							onclick={() => {
								resetPasswordForm();
								void setMode('password');
							}}
						>
							Change
						</Button>
					</div>
				{/snippet}
			</ActionRow>

			<ActionRow
				title="Authenticator app"
				description={hasTotp
					? 'Authenticator app is set up.'
					: 'Use one-time codes from an authenticator app.'}
			>
				{#snippet action()}
					<Button
						variant="outline"
						size="sm"
						disabled={security.unavailable}
						onclick={() => void setMode('totp')}
					>
						Manage
					</Button>
				{/snippet}
			</ActionRow>

			<ActionRow title="Passkeys">
				{#snippet descriptionContent()}
					<p class="text-xs text-muted-foreground">
						Not available yet.
						<a
							class="underline underline-offset-2 hover:text-foreground"
							href="https://workos.com/docs/authkit/passkeys#integrating-via-the-api"
							target="_blank"
							rel="noreferrer"
						>
							Read more
						</a>
					</p>
				{/snippet}
				{#snippet action()}
					<Button variant="outline" size="sm" disabled>Unavailable</Button>
				{/snippet}
			</ActionRow>


			<ActionRow title="Sessions" description="Sign out of any devices you don't recognize.">
				{#snippet action()}
					<Button
						variant="outline"
						size="sm"
						disabled={security.unavailable}
						onclick={() => void setMode('sessions')}
					>
						Manage
					</Button>
				{/snippet}
			</ActionRow>
		</ul>
	</div>
{/if}
