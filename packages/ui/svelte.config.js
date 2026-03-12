import { mdsvex } from 'mdsvex';
import adapter from '@sveltejs/adapter-cloudflare';
import { sveltePreprocess } from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: [sveltePreprocess({ scss: true, typescript: false }), mdsvex()],
	kit: { adapter: adapter(), alias: { '@': 'src/lib/components' } },
	extensions: ['.svelte', '.svx']
};

export default config;
