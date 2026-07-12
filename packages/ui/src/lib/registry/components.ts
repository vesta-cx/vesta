/**
 * Registry of components surfaced in the docs sidebar.
 * Order is preserved in the sidebar.
 */

export type ComponentStatus = 'ready' | 'planned';

export type ComponentEntry = {
	slug: string;
	name: string;
	status: ComponentStatus;
	description?: string;
};

const ready = (slug: string, name: string): ComponentEntry => ({ slug, name, status: 'ready' });

export const componentEntries: ComponentEntry[] = [
	ready('accordion', 'Accordion'),
	ready('alert', 'Alert'),
	ready('alert-dialog', 'Alert Dialog'),
	ready('aspect-ratio', 'Aspect Ratio'),
	ready('avatar', 'Avatar'),
	ready('badge', 'Badge'),
	ready('breadcrumb', 'Breadcrumb'),
	{
		slug: 'button',
		name: 'Button',
		status: 'ready',
		description: 'Trigger an action or navigate to a destination.'
	},
	ready('button-group', 'Button Group'),
	ready('calendar', 'Calendar'),
	ready('card', 'Card'),
	ready('carousel', 'Carousel'),
	ready('chart', 'Chart'),
	ready('checkbox', 'Checkbox'),
	ready('checkbox-with-info', 'Checkbox With Info'),
	ready('collapsible', 'Collapsible'),
	ready('command', 'Command'),
	ready('context-menu', 'Context Menu'),
	ready('data-table', 'Data Table'),
	ready('dialog', 'Dialog'),
	ready('drawer', 'Drawer'),
	ready('dropdown-menu', 'Dropdown Menu'),
	ready('empty', 'Empty'),
	ready('field', 'Field'),
	ready('form', 'Form'),
	ready('heatmap', 'Heatmap'),
	ready('hover-card', 'Hover Card'),
	ready('image', 'Image'),
	ready('input', 'Input'),
	ready('input-group', 'Input Group'),
	ready('input-otp', 'Input OTP'),
	ready('item', 'Item'),
	ready('kbd', 'Kbd'),
	ready('label', 'Label'),
	ready('menubar', 'Menubar'),
	ready('native-select', 'Native Select'),
	ready('navigation-menu', 'Navigation Menu'),
	ready('pagination', 'Pagination'),
	ready('popover', 'Popover'),
	ready('progress', 'Progress'),
	ready('radio-group', 'Radio Group'),
	ready('range-calendar', 'Range Calendar'),
	ready('resizable', 'Resizable'),
	ready('scroll-area', 'Scroll Area'),
	ready('select', 'Select'),
	ready('separator', 'Separator'),
	ready('sheet', 'Sheet'),
	ready('sidebar', 'Sidebar'),
	ready('skeleton', 'Skeleton'),
	ready('slider', 'Slider'),
	ready('sonner', 'Sonner'),
	ready('spinner', 'Spinner'),
	ready('stat-card', 'Stat Card'),
	ready('switch', 'Switch'),
	ready('table', 'Table'),
	ready('tabs', 'Tabs'),
	ready('textarea', 'Textarea'),
	ready('toggle', 'Toggle'),
	ready('toggle-group', 'Toggle Group'),
	ready('tooltip', 'Tooltip')
];

export function findComponent(slug: string): ComponentEntry | undefined {
	return componentEntries.find((entry) => entry.slug === slug);
}
