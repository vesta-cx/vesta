import BookOpenIcon from '@lucide/svelte/icons/book-open';
import ChartPieIcon from '@lucide/svelte/icons/chart-pie';
import CommandIcon from '@lucide/svelte/icons/command';
import FileTextIcon from '@lucide/svelte/icons/file-text';
import FolderKanbanIcon from '@lucide/svelte/icons/folder-kanban';
import GalleryVerticalEndIcon from '@lucide/svelte/icons/gallery-vertical-end';
import HelpCircleIcon from '@lucide/svelte/icons/help-circle';
import HomeIcon from '@lucide/svelte/icons/house';
import InboxIcon from '@lucide/svelte/icons/inbox';
import LayersIcon from '@lucide/svelte/icons/layers';
import SearchIcon from '@lucide/svelte/icons/search';
import SettingsIcon from '@lucide/svelte/icons/settings';
import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
import UsersIcon from '@lucide/svelte/icons/users';

import type { NavItem } from './nav-collapsible.svelte';
import type { NavSecondaryItem } from './nav-secondary.svelte';
import type { DashboardUser } from './nav-user.svelte';
import type { Workspace } from './workspace-switcher.svelte';

export const dashboardWorkspaces: Workspace[] = [
	{ name: 'Vesta Labs', plan: 'Team workspace', logo: GalleryVerticalEndIcon },
	{ name: 'Acme Studio', plan: 'Pro workspace', logo: CommandIcon },
	{ name: 'Indie Co.', plan: 'Free workspace', logo: LayersIcon }
];

export const dashboardUser: DashboardUser = {
	name: 'Mia Rivera',
	email: 'mia@vesta.cx'
};

export const primaryNav: NavItem[] = [
	{ title: 'Overview', href: '/dashboard', icon: HomeIcon },
	{
		title: 'Resources',
		href: '/dashboard/resources',
		icon: FileTextIcon,
		items: [
			{ title: 'All resources', href: '/dashboard/resources' },
			{ title: 'Drafts', href: '/dashboard/resources/drafts' },
			{ title: 'Published', href: '/dashboard/resources/published' },
			{ title: 'Templates', href: '/dashboard/resources/templates' }
		]
	},
	{
		title: 'Collections',
		href: '/dashboard/collections',
		icon: FolderKanbanIcon,
		items: [
			{ title: 'Curated', href: '/dashboard/collections/curated' },
			{ title: 'Smart', href: '/dashboard/collections/smart' },
			{ title: 'Archived', href: '/dashboard/collections/archived' }
		]
	},
	{
		title: 'Engagement',
		href: '/dashboard/engagement',
		icon: InboxIcon,
		items: [
			{ title: 'Inbox', href: '/dashboard/engagement/inbox' },
			{ title: 'Mentions', href: '/dashboard/engagement/mentions' },
			{ title: 'Reactions', href: '/dashboard/engagement/reactions' }
		]
	},
	{ title: 'Analytics', href: '/dashboard/analytics', icon: ChartPieIcon }
];

export const secondaryNav: NavSecondaryItem[] = [
	{ title: 'Workspace settings', href: '/dashboard/settings/workspace', icon: SettingsIcon },
	{ title: 'Members', href: '/dashboard/settings/members', icon: UsersIcon },
	{ title: 'Permissions', href: '/dashboard/settings/permissions', icon: ShieldCheckIcon },
	{ title: 'Search', href: '/dashboard/search', icon: SearchIcon },
	{ title: 'Documentation', href: '/dashboard/docs', icon: BookOpenIcon },
	{ title: 'Get help', href: '/dashboard/help', icon: HelpCircleIcon }
];
