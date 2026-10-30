<script lang="ts">
	import { page } from '$app/state';
	import '$lib/admin/admin.css';

	let { data, children } = $props();

	const nav = [
		{ href: '/admin', label: 'Dashboard', icon: 'fa-gauge' },
		{ href: '/admin/forms', label: 'Forms', icon: 'fa-clipboard-list' },
		{ href: '/admin/email/campaigns', label: 'Campaigns', icon: 'fa-paper-plane' },
		{ href: '/admin/email/templates', label: 'Email templates', icon: 'fa-envelope-open-text' },
		{ href: '/admin/email/suppressions', label: 'Unsubscribes', icon: 'fa-ban' },
		{ href: '/admin/users', label: 'Users', icon: 'fa-users' },
		{ href: '/admin/account', label: 'Account', icon: 'fa-user-gear' }
	];

	let menuOpen = $state(false);

	function isActive(href: string): boolean {
		const path = page.url.pathname;
		return href === '/admin' ? path === '/admin' : path === href || path.startsWith(`${href}/`);
	}
</script>

<svelte:head>
	<meta name="robots" content="noindex, nofollow" />
	<title>Admin | STEM4Palestine</title>
</svelte:head>

<div class="admin admin-shell">
	<aside class="sidebar" class:open={menuOpen}>
		<div class="sidebar-top">
			<a href="/admin" class="brand">STEM4Palestine <span>Admin</span></a>
			<button
				type="button"
				class="menu-toggle"
				aria-label="Toggle menu"
				aria-expanded={menuOpen}
				onclick={() => (menuOpen = !menuOpen)}
			>
				<i class="fas {menuOpen ? 'fa-xmark' : 'fa-bars'}"></i>
			</button>
		</div>

		<nav aria-label="Admin">
			{#each nav as item (item.href)}
				<a
					href={item.href}
					class:active={isActive(item.href)}
					aria-current={isActive(item.href) ? 'page' : undefined}
					onclick={() => (menuOpen = false)}
				>
					<i class="fas {item.icon}"></i>
					{item.label}
				</a>
			{/each}
		</nav>

		<div class="sidebar-bottom">
			<a href="/" target="_blank" rel="noopener noreferrer" class="site-link">
				<i class="fas fa-arrow-up-right-from-square"></i> View site
			</a>
			<div class="signed-in">
				<span class="who">
					<i class="fas fa-circle-user"></i>
					{data.user.displayName}
				</span>
				<form method="POST" action="/admin/logout">
					<button type="submit" class="logout"
						><i class="fas fa-right-from-bracket"></i> Log out</button
					>
				</form>
			</div>
		</div>
	</aside>

	<main class="content">
		{@render children?.()}
	</main>
</div>

<style>
	.admin-shell {
		min-height: 100vh;
		display: grid;
		grid-template-columns: 240px minmax(0, 1fr);
		background: var(--color-bg-secondary);
	}

	.sidebar {
		position: sticky;
		top: 0;
		height: 100vh;
		display: flex;
		flex-direction: column;
		background: #0f172a;
		color: #e2e8f0;
		padding: 1.25rem 0.75rem;
	}

	.sidebar-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 0.5rem 1.25rem;
	}

	.brand {
		font-weight: 800;
		font-size: 1.1rem;
		color: #ffffff;
	}

	.brand span {
		color: var(--color-primary-light);
	}

	.menu-toggle {
		display: none;
		background: none;
		border: none;
		color: inherit;
		font-size: 1.25rem;
		cursor: pointer;
	}

	nav {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	nav a {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		padding: 0.6rem 0.75rem;
		border-radius: 8px;
		color: #cbd5e1;
		font-weight: 500;
		transition:
			background-color 0.15s,
			color 0.15s;
	}

	nav a i {
		width: 1.1rem;
		text-align: center;
	}

	nav a:hover {
		background: rgba(255, 255, 255, 0.06);
		color: #ffffff;
	}

	nav a.active {
		background: var(--color-primary);
		color: #ffffff;
	}

	.sidebar-bottom {
		margin-top: auto;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0 0.5rem;
		font-size: 0.9rem;
	}

	.site-link {
		color: #94a3b8;
	}

	.site-link:hover {
		color: #ffffff;
	}

	.signed-in {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding-top: 0.75rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.who {
		color: #ffffff;
		font-weight: 600;
	}

	.logout {
		background: none;
		border: none;
		padding: 0;
		color: #94a3b8;
		font: inherit;
		cursor: pointer;
	}

	.logout:hover {
		color: #ffffff;
	}

	.content {
		padding: 2rem clamp(1rem, 3vw, 2.5rem) 4rem;
		max-width: 1400px;
		width: 100%;
	}

	@media (max-width: 900px) {
		/* minmax(0, …) so a wide table scrolls inside its card instead of widening the page. */
		.admin-shell {
			grid-template-columns: minmax(0, 1fr);
		}

		.sidebar {
			position: sticky;
			height: auto;
			z-index: 20;
			padding: 0.75rem;
		}

		.sidebar-top {
			padding: 0 0.25rem;
		}

		.menu-toggle {
			display: block;
		}

		nav,
		.sidebar-bottom {
			display: none;
		}

		.sidebar.open nav,
		.sidebar.open .sidebar-bottom {
			display: flex;
			margin-top: 1rem;
		}
	}
</style>
