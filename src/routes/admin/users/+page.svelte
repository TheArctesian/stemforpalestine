<script lang="ts">
	import { page } from '$app/state';

	let { data } = $props();

	const created = $derived(page.url.searchParams.get('created'));
	const deleted = $derived(page.url.searchParams.get('deleted'));

	const dateTime = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' });
</script>

<svelte:head>
	<title>Users | STEM4Palestine Admin</title>
</svelte:head>

<header class="page-header">
	<div>
		<h1>Users</h1>
		<p>
			Accounts for organizers. Admins can manage everything; member accounts are for the upcoming
			member platform.
		</p>
	</div>
	<a href="/admin/users/new" class="btn btn-primary"><i class="fas fa-user-plus"></i> New user</a>
</header>

{#if created}
	<p class="flash flash-success" role="status">Created the account <strong>{created}</strong>.</p>
{:else if deleted}
	<p class="flash flash-success" role="status">Deleted the account <strong>{deleted}</strong>.</p>
{/if}

<div class="card">
	<div class="table-wrap">
		<table class="list">
			<thead>
				<tr>
					<th>Name</th>
					<th>Username</th>
					<th>Email</th>
					<th>Role</th>
					<th>Status</th>
					<th>Last sign-in</th>
					<th><span class="visually-hidden">Actions</span></th>
				</tr>
			</thead>
			<tbody>
				{#each data.users as user (user.id)}
					<tr>
						<td>
							<strong>{user.displayName}</strong>
							{#if user.id === data.user.id}<span class="badge">You</span>{/if}
						</td>
						<td>{user.username}</td>
						<td>{user.email ?? '—'}</td>
						<td>
							<span class="badge {user.role === 'admin' ? 'badge-blue' : ''}">{user.role}</span>
						</td>
						<td>
							<span class="badge {user.status === 'active' ? 'badge-green' : 'badge-red'}"
								>{user.status}</span
							>
						</td>
						<td class="muted">{user.lastLoginAt ? dateTime.format(user.lastLoginAt) : 'Never'}</td>
						<td><a href="/admin/users/{user.id}" class="btn btn-small">Edit</a></td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
