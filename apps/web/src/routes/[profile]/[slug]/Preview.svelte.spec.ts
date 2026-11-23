import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Preview from './Preview.svelte';

describe('release preview', () => {
	it('plays and pauses the preview', async () => {
		render(Preview, { url: 'releases/west-end-blues.mp3', duration: 30 });

		await page.getByRole('button', { name: 'Play preview' }).click();
		const pause = page.getByRole('button', { name: 'Pause preview' });
		await expect.element(pause).toBeVisible();
		await pause.click();
		await expect.element(page.getByRole('button', { name: 'Play preview' })).toBeVisible();
	});
});
