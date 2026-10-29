import { mdsvex } from 'mdsvex';
import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: [vitePreprocess(), mdsvex()],
	kit: {
		// Node, not Edge: password hashing (@node-rs/argon2) is a native addon, and pg needs TCP.
		adapter: adapter({ runtime: 'nodejs22.x' })
	},
	extensions: ['.svelte', '.svx']
};

export default config;
