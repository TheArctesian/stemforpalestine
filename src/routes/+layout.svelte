<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
	import { dev } from '$app/environment';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';

	injectAnalytics({ mode: dev ? 'development' : 'production' });

	let menuOpen = $state(false);

	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	function closeMenu() {
		menuOpen = false;
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
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

<div class="app">
	<header>
		<nav class="nav">
			<div class="nav-container">
				<a href="/" class="logo">STEM4Palestine</a>

				<!-- Hamburger Button (mobile only) -->
				<button class="hamburger" onclick={toggleMenu} aria-label="Toggle menu" aria-expanded={menuOpen}>
					<span class="hamburger-line" class:open={menuOpen}></span>
					<span class="hamburger-line" class:open={menuOpen}></span>
					<span class="hamburger-line" class:open={menuOpen}></span>
				</button>

				<!-- Navigation Links -->
				<div class="nav-links" class:open={menuOpen}>
					<a href="/letter" onclick={closeMenu}>Open Letter</a>
					<a href="https://stem4pal.fillout.com/interest" target="_blank" rel="noopener noreferrer" onclick={closeMenu}>Get Involved</a>
					<a href="/#projects" onclick={closeMenu}>Projects</a>
				</div>
			</div>
		</nav>
	</header>

	<main>
		{@render children?.()}
	</main>

	<footer>
		<div class="footer-container">
			<div class="footer-content">
				<div class="footer-section">
					<h3>Contact</h3>
					<p>info@stem4pal.org</p>
				</div>
			</div>
			<div class="footer-bottom">
				<p>&copy; 2025 STEM4Palestine. Liberation through collective action.</p>
			</div>
		</div>
	</footer>
</div>

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

	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	header {
		background-color: var(--color-primary);
		color: #ffffff;
		position: sticky;
		top: 0;
		z-index: 100;
		box-shadow: 0 2px 10px rgba(0, 150, 57, 0.3);
	}

	.nav {
		padding: 1rem 0;
	}

	.nav-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.logo {
		font-size: 1.5rem;
		font-weight: 800;
		color: #ffffff;
		text-decoration: none;
	}

	.nav-links {
		display: flex;
		gap: 2rem;
	}

	.nav-links a {
		color: #ffffff;
		font-weight: 500;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		transition: background-color 0.2s;
	}

	.nav-links a:hover {
		background-color: var(--color-primary-dark);
		transform: translateY(-1px);
	}

	/* Hamburger Button */
	.hamburger {
		display: none;
		flex-direction: column;
		justify-content: center;
		gap: 5px;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
		z-index: 101;
	}

	.hamburger-line {
		width: 24px;
		height: 3px;
		background-color: #ffffff;
		border-radius: 2px;
		transition: all 0.3s ease;
	}

	.hamburger-line.open:nth-child(1) {
		transform: rotate(45deg) translate(5px, 6px);
	}

	.hamburger-line.open:nth-child(2) {
		opacity: 0;
	}

	.hamburger-line.open:nth-child(3) {
		transform: rotate(-45deg) translate(5px, -6px);
	}

	main {
		flex: 1;
	}

	footer {
		background-color: #1a202c;
		color: #ffffff;
		margin-top: 4rem;
	}

	.footer-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 3rem 1rem 1rem;
	}

	.footer-content {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.footer-section h3 {
		color: var(--color-primary-light);
		margin-bottom: 1rem;
		font-size: 1.1rem;
	}

	.social-links {
		display: flex;
		gap: 1rem;
	}

	.social-links a {
		color: #ffffff;
		padding: 0.5rem;
		border: 1px solid #4a5568;
		border-radius: 4px;
		transition: border-color 0.2s;
	}

	.social-links a:hover {
		border-color: var(--color-primary-light);
	}

	.footer-bottom {
		border-top: 1px solid #4a5568;
		padding-top: 1rem;
		text-align: center;
		opacity: 0.8;
	}

	@media (max-width: 768px) {
		.nav-container {
			flex-direction: row;
			flex-wrap: wrap;
			justify-content: space-between;
		}

		.hamburger {
			display: flex;
		}

		.nav-links {
			display: none;
			flex-direction: column;
			width: 100%;
			gap: 0;
			padding-top: 1rem;
		}

		.nav-links.open {
			display: flex;
		}

		.nav-links a {
			padding: 1rem;
			text-align: center;
			border-top: 1px solid var(--color-primary-dark);
		}

		.nav-links a:hover {
			background-color: var(--color-primary-dark);
			transform: none;
		}

		.footer-content {
			grid-template-columns: 1fr;
			text-align: center;
		}
	}
</style>
