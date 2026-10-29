<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { dev } from '$app/environment';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';

	let { children } = $props();

	injectAnalytics({ mode: dev ? 'development' : 'production' });
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
		rel="stylesheet"
	/>

	<link
		rel="stylesheet"
		href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
		integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
		crossorigin="anonymous"
		referrerpolicy="no-referrer"
	/>
</svelte:head>

{@render children?.()}

<style>
	/* Color Variables */
	:root {
		/* Palestinian Flag Green Primary Colors */
		--color-primary: #009639;
		--color-primary-light: #00b849;
		--color-primary-dark: #007a2e;
		--color-primary-darker: #005f23;

		/* Header Color (Blue complement) */
		--color-header: #1e40af;
		--color-header-light: #3b82f6;
		--color-header-dark: #1d4ed8;

		/* Neutral Colors */
		--color-text-primary: #2d3748;
		--color-text-secondary: #4a5568;
		--color-text-light: #718096;
		--color-text-white: #ffffff;

		/* Background Colors */
		--color-bg-primary: #ffffff;
		--color-bg-secondary: #f7fafc;
		--color-bg-dark: #1a202c;
		--color-bg-darker: #2d3748;

		/* Border Colors */
		--color-border-light: #e2e8f0;
		--color-border-medium: #cbd5e0;
		--color-border-dark: #4a5568;
	}

	:global(*) {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
	}

	:global(body) {
		font-family: 'Inter', sans-serif;
		line-height: 1.6;
		color: #2d3748;
		background-color: #ffffff;
	}

	:global(a) {
		color: inherit;
		text-decoration: none;
	}

	:global(h1, h2, h3, h4, h5, h6) {
		font-weight: 700;
		line-height: 1.2;
		margin-bottom: 1rem;
	}

	:global(p) {
		margin-bottom: 1rem;
	}
</style>
