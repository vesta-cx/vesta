import CalendarClockIcon from '@lucide/svelte/icons/calendar-clock';
import CompassIcon from '@lucide/svelte/icons/compass';
import Disc3Icon from '@lucide/svelte/icons/disc-3';
import DownloadCloudIcon from '@lucide/svelte/icons/download-cloud';
import HelpCircleIcon from '@lucide/svelte/icons/help-circle';
import HomeIcon from '@lucide/svelte/icons/house';
import LayersIcon from '@lucide/svelte/icons/layers';
import LibraryIcon from '@lucide/svelte/icons/library';
import LinkIcon from '@lucide/svelte/icons/link';
import MegaphoneIcon from '@lucide/svelte/icons/megaphone';
import MicIcon from '@lucide/svelte/icons/mic-2';
import MusicIcon from '@lucide/svelte/icons/music';
import PlugZapIcon from '@lucide/svelte/icons/plug-zap';
import SettingsIcon from '@lucide/svelte/icons/settings';
import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
import SparklesIcon from '@lucide/svelte/icons/sparkles';
import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
import UsersIcon from '@lucide/svelte/icons/users';

import type { NavItem } from './nav-collapsible.svelte';
import type { NavSecondaryItem } from './nav-secondary.svelte';
import type { DashboardUser } from './nav-user.svelte';
import type { Workspace } from './workspace-switcher.svelte';

/**
 * Vesta is release-marketing infrastructure for independent music: smart links,
 * release pages, artist/label profiles, and campaign posts. The nav model below
 * mirrors the domain (workspaces, releases, smart links, posts, audience) instead
 * of generic CMS scaffolding.
 */

export const dashboardWorkspaces: Workspace[] = [
	{ name: 'Hollow Coast', plan: 'Artist · DIY', logo: MicIcon },
	{ name: 'Topaz Records', plan: 'Label · 12 artists', logo: LibraryIcon },
	{ name: 'Quiet Sun', plan: 'Artist · Pro', logo: Disc3Icon }
];

export const dashboardUser: DashboardUser = {
	name: 'Mia Rivera',
	email: 'mia@vesta.cx'
};

/** Solo creator nav: optimised for one artist running their own releases. */
export const creatorNav: NavItem[] = [
	{ title: 'Overview', href: '/dashboard', icon: HomeIcon },
	{
		title: 'Releases',
		href: '/dashboard/releases',
		icon: MusicIcon,
		items: [
			{ title: 'Upcoming', href: '/dashboard/releases/upcoming' },
			{ title: 'Live', href: '/dashboard/releases/live' },
			{ title: 'Drafts', href: '/dashboard/releases/drafts' },
			{ title: 'Archive', href: '/dashboard/releases/archive' }
		]
	},
	{ title: 'Smart links', href: '/dashboard/smart-links', icon: LinkIcon },
	{
		title: 'Posts',
		href: '/dashboard/posts',
		icon: MegaphoneIcon,
		items: [
			{ title: 'Scheduled', href: '/dashboard/posts/scheduled' },
			{ title: 'Drafts', href: '/dashboard/posts/drafts' },
			{ title: 'Published', href: '/dashboard/posts/published' }
		]
	},
	{ title: 'Profile', href: '/dashboard/profile', icon: CompassIcon },
	{
		title: 'Audience',
		href: '/dashboard/audience',
		icon: UsersIcon,
		items: [
			{ title: 'Followers', href: '/dashboard/audience/followers' },
			{ title: 'Pre-saves', href: '/dashboard/audience/pre-saves' },
			{ title: 'Mentions', href: '/dashboard/audience/mentions' }
		]
	},
	{ title: 'Insights', href: '/dashboard/insights', icon: TrendingUpIcon }
];

/** Label/manager nav: pivots around a roster of artists and releases across them. */
export const labelNav: NavItem[] = [
	{ title: 'Overview', href: '/dashboard-2', icon: HomeIcon },
	{
		title: 'Roster',
		href: '/dashboard-2/roster',
		icon: LibraryIcon,
		items: [
			{ title: 'Active', href: '/dashboard-2/roster/active' },
			{ title: 'Onboarding', href: '/dashboard-2/roster/onboarding' },
			{ title: 'Inactive', href: '/dashboard-2/roster/inactive' }
		]
	},
	{
		title: 'Releases',
		href: '/dashboard-2/releases',
		icon: MusicIcon,
		items: [
			{ title: 'Calendar', href: '/dashboard-2/releases/calendar' },
			{ title: 'Active', href: '/dashboard-2/releases/active' },
			{ title: 'Drafts', href: '/dashboard-2/releases/drafts' }
		]
	},
	{
		title: 'Campaigns',
		href: '/dashboard-2/campaigns',
		icon: MegaphoneIcon,
		items: [
			{ title: 'Active', href: '/dashboard-2/campaigns/active' },
			{ title: 'Scheduled', href: '/dashboard-2/campaigns/scheduled' },
			{ title: 'Archive', href: '/dashboard-2/campaigns/archive' }
		]
	},
	{ title: 'Smart links', href: '/dashboard-2/smart-links', icon: LinkIcon },
	{ title: 'Audience', href: '/dashboard-2/audience', icon: UsersIcon },
	{ title: 'Insights', href: '/dashboard-2/insights', icon: TrendingUpIcon }
];

/** Campaign cockpit nav: stripped down — single release in flight gets the focus. */
export const cockpitNav: NavItem[] = [
	{ title: 'Now playing', href: '/dashboard-3', icon: SparklesIcon },
	{ title: 'Releases', href: '/dashboard-3/releases', icon: MusicIcon },
	{ title: 'Smart links', href: '/dashboard-3/smart-links', icon: LinkIcon },
	{ title: 'Posts', href: '/dashboard-3/posts', icon: MegaphoneIcon },
	{ title: 'Audience', href: '/dashboard-3/audience', icon: UsersIcon }
];

/** Settings/utility surfaces shared across variants — bottom rail material. */
export const utilityNav: NavSecondaryItem[] = [
	{ title: 'Imports', href: '/dashboard/imports', icon: DownloadCloudIcon },
	{ title: 'Integrations', href: '/dashboard/integrations', icon: PlugZapIcon },
	{ title: 'Workspace settings', href: '/dashboard/settings/workspace', icon: SettingsIcon },
	{ title: 'Help', href: '/dashboard/help', icon: HelpCircleIcon }
];

/** Label-flavoured utility rail — adds members/permissions for multi-user accounts. */
export const labelUtilityNav: NavSecondaryItem[] = [
	{ title: 'Imports', href: '/dashboard-2/imports', icon: DownloadCloudIcon },
	{ title: 'Integrations', href: '/dashboard-2/integrations', icon: PlugZapIcon },
	{ title: 'Members', href: '/dashboard-2/settings/members', icon: UsersIcon },
	{ title: 'Permissions', href: '/dashboard-2/settings/permissions', icon: ShieldCheckIcon },
	{ title: 'Workspace settings', href: '/dashboard-2/settings/workspace', icon: SettingsIcon },
	{ title: 'Help', href: '/dashboard-2/help', icon: HelpCircleIcon }
];

/** Featured release used by the campaign cockpit layout. */
export type FeaturedRelease = {
	title: string;
	type: 'song' | 'album';
	artist: string;
	releaseDate: string;
	coverGradient: string;
	platforms: string[];
};

export const featuredRelease: FeaturedRelease = {
	title: 'Tidewater EP',
	type: 'album',
	artist: 'Hollow Coast',
	releaseDate: '2026-05-09',
	coverGradient:
		'linear-gradient(135deg, oklch(0.62 0.18 250) 0%, oklch(0.45 0.16 290) 50%, oklch(0.32 0.12 320) 100%)',
	platforms: ['Spotify', 'Apple Music', 'Bandcamp', 'YouTube Music', 'Tidal']
};

/** Tiny re-export so existing variants keep building during the migration. */
export const primaryNav = creatorNav;
export const secondaryNav = utilityNav;

/** Calendar items used in the label dashboard preview. */
export type RosterReleaseRow = {
	artist: string;
	title: string;
	type: 'single' | 'album' | 'EP';
	releaseDate: string;
	status: 'Drafting' | 'Pre-save live' | 'Out';
};

export const rosterCalendar: RosterReleaseRow[] = [
	{
		artist: 'Hollow Coast',
		title: 'Tidewater EP',
		type: 'EP',
		releaseDate: 'May 9',
		status: 'Pre-save live'
	},
	{
		artist: 'Quiet Sun',
		title: 'Lantern',
		type: 'single',
		releaseDate: 'May 16',
		status: 'Drafting'
	},
	{
		artist: 'Tess Marin',
		title: 'Glasshouse',
		type: 'album',
		releaseDate: 'Jun 6',
		status: 'Drafting'
	},
	{
		artist: 'Ardo',
		title: 'Heat (single)',
		type: 'single',
		releaseDate: 'Apr 25',
		status: 'Out'
	}
];

/** Lightweight calendar marker for cockpit layout. */
export const upcomingMilestones = [
	{ icon: CalendarClockIcon, label: 'Pre-save link goes live', when: 'in 2 days' },
	{ icon: MegaphoneIcon, label: 'Announcement post scheduled', when: 'in 5 days' },
	{ icon: MusicIcon, label: 'Tidewater EP releases', when: 'in 12 days' },
	{ icon: LayersIcon, label: 'Bandcamp pre-order opens', when: 'in 14 days' }
];
