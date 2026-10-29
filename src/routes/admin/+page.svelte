<script lang="ts">
	let { data } = $props();

	const sections = [
		{
			href: '/admin/forms',
			icon: 'fa-clipboard-list',
			title: 'Forms',
			description: 'Build sign-up forms and see who has filled them in.'
		},
		{
			href: '/admin/users',
			icon: 'fa-users',
			title: 'Users',
			description: 'Create organizer accounts, reset passwords, manage access.'
		},
		{
			href: '/admin/account',
			icon: 'fa-user-gear',
			title: 'Account',
			description: 'Change the password for the account you are signed in with.'
		}
	];
</script>

<svelte:head>
	<title>Dashboard | STEM4Palestine Admin</title>
</svelte:head>

<header class="page-header">
	<div>
		<h1>Welcome, {data.user.displayName}</h1>
		<p>Manage stem4pal.org from here.</p>
	</div>
</header>

<div class="stats">
	<div class="card stat">
		<span class="stat-value">{data.stats.submissionsThisWeek}</span>
		<span class="stat-label">Submissions in the last 7 days</span>
	</div>
	<div class="card stat">
		<span class="stat-value">{data.stats.openForms}</span>
		<span class="stat-label">Open forms</span>
	</div>
	<div class="card stat">
		<span class="stat-value">{data.stats.activeUsers}</span>
		<span class="stat-label">Active accounts</span>
	</div>
</div>

<div class="sections">
	{#each sections as section (section.href)}
		<a href={section.href} class="card section">
			<i class="fas {section.icon}"></i>
			<h2>{section.title}</h2>
			<p>{section.description}</p>
		</a>
	{/each}
</div>

<style>
	.stats,
	.sections {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 1.25rem;
		margin-bottom: 1.5rem;
	}

	/* .card + .card spacing is for stacked cards; grids space themselves. */
	.stats :global(.card + .card),
	.sections :global(.card + .card) {
		margin-top: 0;
	}

	.stat {
		display: flex;
		flex-direction: column;
	}

	.stat-value {
		font-size: 2rem;
		font-weight: 800;
		color: var(--color-text-primary);
	}

	.stat-label {
		color: var(--color-text-light);
		font-weight: 500;
	}

	.section {
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
	}

	.section:hover {
		border-color: var(--color-primary);
		box-shadow: 0 8px 24px rgba(0, 150, 57, 0.12);
	}

	.section i {
		font-size: 1.4rem;
		color: var(--color-primary);
		margin-bottom: 0.75rem;
	}

	.section h2 {
		font-size: 1.1rem;
		margin-bottom: 0.35rem;
	}

	.section p {
		color: var(--color-text-secondary);
		margin: 0;
	}
</style>
