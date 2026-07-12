<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import BellIcon from '@lucide/svelte/icons/bell';
	import CreditCardIcon from '@lucide/svelte/icons/credit-card';
	import DatabaseIcon from '@lucide/svelte/icons/database';
	import IdCardIcon from '@lucide/svelte/icons/id-card';
	import PackageIcon from '@lucide/svelte/icons/package';
	import ShieldIcon from '@lucide/svelte/icons/shield';
	import UserRoundIcon from '@lucide/svelte/icons/user-round';
	import AccountSettings from './account-settings.svelte';
	import DataPrivacySettings from './data-privacy-settings.svelte';
	import ProfileSettings from './profile-settings.svelte';
	import SecuritySettings from './security-settings.svelte';
	import SettingsDialog, { type SettingsCategory } from './settings-dialog.svelte';
	import type { DashboardSecurity, DashboardUser } from '$lib/components/dashboard/nav-user.svelte';

	let { user, security }: { user: DashboardUser; security: DashboardSecurity } = $props();

	let settingsOpen = $state(false);
	const settingsPath = $derived(page.url.searchParams.get('settings'));
	const activeSettingsCategory = $derived(settingsPath?.split('/')[0] ?? null);
	let openedFromUrl = $state(false);

	$effect(() => {
		if (settingsPath) {
			openedFromUrl = true;
			settingsOpen = true;
		} else if (openedFromUrl) {
			openedFromUrl = false;
			settingsOpen = false;
		}
	});

	$effect(() => {
		if (!settingsOpen && settingsPath) {
			const nextUrl = new URL(page.url);
			nextUrl.searchParams.delete('settings');
			void goto(nextUrl, { keepFocus: true, noScroll: true });
		}
	});

	const settingsCategories: SettingsCategory[] = [
		{
			id: 'profile',
			title: 'Profile',
			icon: IdCardIcon,
			enabled: true,
			content: profileContent
		},
		{
			id: 'account',
			title: 'Account',
			icon: UserRoundIcon,
			enabled: true,
			content: accountContent
		},
		{
			id: 'security',
			title: 'Security',
			icon: ShieldIcon,
			enabled: true,
			content: securityContent
		},
		{
			id: 'data-privacy',
			title: 'Data & privacy',
			icon: DatabaseIcon,
			enabled: true,
			content: dataPrivacyContent
		},
		{ id: 'notifications', title: 'Notifications', icon: BellIcon, enabled: false },
		{ id: 'subscriptions', title: 'Subscriptions', icon: PackageIcon, enabled: false },
		{ id: 'billing', title: 'Billing', icon: CreditCardIcon, enabled: false }
	];
</script>

{#snippet profileContent()}
	<ProfileSettings displayName={user.displayName} handle={user.handle} bio={user.bio} />
{/snippet}

{#snippet accountContent()}
	<AccountSettings
		firstName={user.firstName}
		lastName={user.lastName}
		email={user.email}
		emailVerified={user.emailVerified}
	/>
{/snippet}

{#snippet securityContent()}
	<SecuritySettings {security} email={user.email} emailVerified={user.emailVerified} />
{/snippet}

{#snippet dataPrivacyContent()}
	<DataPrivacySettings />
{/snippet}

<SettingsDialog
	bind:open={settingsOpen}
	categories={settingsCategories}
	initialCategoryId="profile"
	activeCategoryId={activeSettingsCategory}
/>
