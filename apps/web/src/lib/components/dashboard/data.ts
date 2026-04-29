import BarChart3Icon from '@lucide/svelte/icons/bar-chart-3';
import Disc3Icon from '@lucide/svelte/icons/disc-3';
import FileTextIcon from '@lucide/svelte/icons/file-text';
import FolderKanbanIcon from '@lucide/svelte/icons/folder-kanban';
import LibraryIcon from '@lucide/svelte/icons/library';
import MegaphoneIcon from '@lucide/svelte/icons/megaphone';
import MicIcon from '@lucide/svelte/icons/mic-2';
import PaletteIcon from '@lucide/svelte/icons/palette';
import UsersIcon from '@lucide/svelte/icons/users';

import type { NavItem } from './nav-collapsible.svelte';
import type { DashboardUser } from './nav-user.svelte';

/**
 * Vesta is release-marketing infrastructure for independent music.
 * The dashboard pivots around a workspace (artist or label brand surface),
 * which is owned by either a user (personal) or an organization (label/team).
 */

export type WorkspaceKind = 'artist' | 'label';

export type Workspace = {
	id: string;
	name: string;
	kind: WorkspaceKind;
	subtitle: string;
	logo: import('svelte').Component;
	/** null when the workspace is personal (owned directly by the user). */
	organizationId: string | null;
};

export type Organization = {
	id: string;
	name: string;
	/** Whether the active user can administer this organization. */
	manageable: boolean;
};

export const dashboardOrganizations: Organization[] = [
	{ id: 'org_topaz', name: 'Topaz Records', manageable: true },
	{ id: 'org_unspoken', name: 'Unspoken Collective', manageable: false }
];

export const dashboardWorkspaces: Workspace[] = [
	{
		id: 'ws_hollowcoast',
		name: 'Hollow Coast',
		kind: 'artist',
		subtitle: 'Artist · personal',
		logo: MicIcon,
		organizationId: null
	},
	{
		id: 'ws_topaz_label',
		name: 'Topaz Records',
		kind: 'label',
		subtitle: 'Label workspace',
		logo: LibraryIcon,
		organizationId: 'org_topaz'
	},
	{
		id: 'ws_tessmarin',
		name: 'Tess Marin',
		kind: 'artist',
		subtitle: 'Artist · signed',
		logo: Disc3Icon,
		organizationId: 'org_topaz'
	},
	{
		id: 'ws_quietsun',
		name: 'Quiet Sun',
		kind: 'artist',
		subtitle: 'Artist · signed',
		logo: MicIcon,
		organizationId: 'org_topaz'
	},
	{
		id: 'ws_ardo',
		name: 'Ardo',
		kind: 'artist',
		subtitle: 'Artist · signed',
		logo: Disc3Icon,
		organizationId: 'org_unspoken'
	}
];

export const dashboardUser: DashboardUser = {
	name: 'Mia Rivera',
	email: 'mia@vesta.cx'
};

/**
 * Top-level nav. Each parent links to its own analytics surface; the chevron
 * toggles its sub-routes. Sub-items are filters / specific views, not the
 * landing page (the parent is).
 *
 *  - Analytics: workspace overview (smart-link clicks, pre-saves, momentum).
 *  - Resources: songs/albums/posts/statuses (the resources table).
 *  - Collections: playlists, label roster, curated bundles.
 *  - Campaigns: smart links and pre-save flows tying releases to platforms.
 *  - Branding: workspace profile, external links, theme.
 *  - Community: engagements (followers, mentions, replies).
 */
export const dashboardNav: NavItem[] = [
	{ title: 'Analytics', href: '/dashboard', icon: BarChart3Icon },
	{
		title: 'Resources',
		href: '/dashboard/resources',
		icon: FileTextIcon,
		items: [
			{ title: 'Releases', href: '/dashboard/resources/releases' },
			{ title: 'Posts', href: '/dashboard/resources/posts' },
			{ title: 'Drafts', href: '/dashboard/resources/drafts' }
		]
	},
	{
		title: 'Collections',
		href: '/dashboard/collections',
		icon: FolderKanbanIcon,
		items: [
			{ title: 'Playlists', href: '/dashboard/collections/playlists' },
			{ title: 'Roster', href: '/dashboard/collections/roster' }
		]
	},
	{
		title: 'Campaigns',
		href: '/dashboard/campaigns',
		icon: MegaphoneIcon,
		items: [
			{ title: 'Smart links', href: '/dashboard/campaigns/smart-links' },
			{ title: 'Pre-saves', href: '/dashboard/campaigns/pre-saves' }
		]
	},
	{
		title: 'Branding',
		href: '/dashboard/branding',
		icon: PaletteIcon,
		items: [
			{ title: 'Profile', href: '/dashboard/branding/profile' },
			{ title: 'Links', href: '/dashboard/branding/links' },
			{ title: 'Theme', href: '/dashboard/branding/theme' }
		]
	},
	{
		title: 'Community',
		href: '/dashboard/community',
		icon: UsersIcon,
		items: [
			{ title: 'Inbox', href: '/dashboard/community/inbox' },
			{ title: 'Mentions', href: '/dashboard/community/mentions' },
			{ title: 'Followers', href: '/dashboard/community/followers' }
		]
	}
];

export const workspaceSettingsHref = (workspaceId: string) =>
	`/dashboard/workspaces/${workspaceId}/settings`;

export const organizationSettingsHref = (organizationId: string) =>
	`/dashboard/organizations/${organizationId}/settings`;
