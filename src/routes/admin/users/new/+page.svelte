<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
	const values = $derived<Record<string, string | undefined>>(form?.values ?? {});
	const errors = $derived<Record<string, string | undefined>>(form?.errors ?? {});
</script>

<svelte:head>
	<title>New user | STEM4Palestine Admin</title>
</svelte:head>

<a href="/admin/users" class="back-link"><i class="fas fa-arrow-left"></i> Users</a>
<header class="page-header">
	<div>
		<h1>New user</h1>
		<p>Share the temporary password with them privately; they can change it under Account.</p>
	</div>
</header>

<form method="POST" class="card" use:enhance>
	{#if errors.form}<p class="flash flash-error" role="alert">{errors.form}</p>{/if}

	<div class="form-grid">
		<div class="field">
			<label for="displayName">Name</label>
			<input
				id="displayName"
				name="displayName"
				type="text"
				required
				value={values.displayName ?? ''}
				aria-invalid={!!errors.displayName}
			/>
			{#if errors.displayName}<p class="field-error">{errors.displayName}</p>{/if}
		</div>
		<div class="field">
			<label for="username">Username</label>
			<input
				id="username"
				name="username"
				type="text"
				required
				autocapitalize="none"
				spellcheck="false"
				value={values.username ?? ''}
				aria-invalid={!!errors.username}
			/>
			{#if errors.username}<p class="field-error">{errors.username}</p>{/if}
		</div>
		<div class="field">
			<label for="email">Email <span class="muted">(optional)</span></label>
			<input
				id="email"
				name="email"
				type="email"
				value={values.email ?? ''}
				aria-invalid={!!errors.email}
			/>
			{#if errors.email}<p class="field-error">{errors.email}</p>{/if}
		</div>
		<div class="field">
			<label for="role">Role</label>
			<select id="role" name="role" value={values.role ?? 'member'}>
				<option value="member">Member</option>
				<option value="admin">Admin</option>
			</select>
			<p class="hint">Admins can manage forms, emails, events and users.</p>
		</div>
		<div class="field">
			<label for="password">Temporary password</label>
			<input
				id="password"
				name="password"
				type="password"
				required
				autocomplete="new-password"
				aria-invalid={!!errors.password}
			/>
			{#if errors.password}<p class="field-error">{errors.password}</p>{/if}
		</div>
	</div>

	<div class="actions">
		<button type="submit" class="btn btn-primary"
			><i class="fas fa-user-plus"></i> Create user</button
		>
		<a href="/admin/users" class="btn">Cancel</a>
	</div>
</form>
