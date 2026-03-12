/**
 * Capture OG image (1200×630): title + tagline on canvas, dark mode.
 * Uses /og route (no header, cookie dialog, or buttons).
 * Run with dev server: pnpm dev, then: pnpm capture-og
 */

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'static', 'og.png');
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173';
const OG_URL = `${BASE_URL.replace(/\/$/, '')}/og`;

async function main() {
	const browser = await chromium.launch();
	const page = await browser.newPage();

	// Set dark mode before page loads so HeroCanvas reads correct --primary
	await page.addInitScript(() => {
		document.documentElement.setAttribute('data-theme', 'dark');
	});

	await page.setViewportSize({ width: OG_WIDTH, height: OG_HEIGHT });
	// Emulate dark system preference (backup for data-theme="auto")
	await page.emulateMedia({ colorScheme: 'dark' });
	await page.goto(OG_URL, { waitUntil: 'networkidle' });

	// Force dark mode (in case Svelte/theme overwrote addInitScript)
	await page.evaluate(() => {
		document.documentElement.setAttribute('data-theme', 'dark');
	});

	// Wait for HeroCanvas to mount, resize, and draw at least one frame
	await page.waitForSelector('canvas[aria-hidden="true"]', { state: 'visible' });
	await page.waitForFunction(
		() => {
			const c = document.querySelector('canvas[aria-hidden="true"]') as HTMLCanvasElement;
			return c && c.width > 0 && c.height > 0;
		},
		{ timeout: 5000 }
	);
	// Allow animation frames to paint
	await new Promise((r) => setTimeout(r, 800));

	const buffer = await page.screenshot({ type: 'png' });

	mkdirSync(dirname(OUT), { recursive: true });
	writeFileSync(OUT, buffer);
	console.log(`Wrote ${OUT}`);

	await browser.close();
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
