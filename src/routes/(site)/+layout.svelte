<script lang="ts">
	let { children } = $props();

	let menuOpen = $state(false);

	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	function closeMenu() {
		menuOpen = false;
	}
</script>

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
					<a href="/divest" onclick={closeMenu}>Divestment Vote</a>
					<a href="/events" onclick={closeMenu}>Events</a>
					<a href="/interest" onclick={closeMenu}>Get Involved</a>
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
