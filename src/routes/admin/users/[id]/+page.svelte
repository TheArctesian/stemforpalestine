<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import ConfirmButton from '$lib/admin/ConfirmButton.svelte';

	let { data, form } = $props();
	const account = $derived(data.account);
	const isMe = $derived(account.id === data.user.id);

	/** Results for one action only, so a message shows next to the form that caused it. */
	function resultFor(action: string) {
		return form?.action === action ? form : undefined;
	}

	type Errors = Record<string, string | undefined>;
	const updateErrors = $derived((resultFor('update')?.errors ?? {}) as Errors);
	const passwordErrors = $derived((resultFor('password')?.errors ?? {}) as Errors);

	const keepValues: SubmitFunction =
		() =>
		async ({ update }) =>
			update({ reset: false });
</script>

<svelte:head>
	<title>{account.displayName} | STEM4Palestine Admin</title>
</svelte:head>

<a href="/admin/users" class="back-link"><i class="fas fa-arrow-left"></i> Users</a>
<header class="page-header">
	<div>
		<h1>{account.displayName}</h1>
		<p>
			@{account.username}{#if isMe}
				· this is you{/if}
		</p>
	</div>
</header>

{#snippet messages(action: string)}
	{@const result = resultFor(action)}
	{#if result?.success}<p class="flash flash-success" role="status">{result.success}</p>{/if}
	{#if result?.errors?.form}<p class="flash flash-error" role="alert">{result.errors.form}</p>{/if}
{/snippet}

<form method="POST" action="?/update" class="card" use:enhance={keepValues}>
	<h2>Profile</h2>
	{@render messages('update')}

	<div class="form-grid">
		<div class="field">
			<label for="displayName">Name</label>
			<input
				id="displayName"
				name="displayName"
				type="text"
				required
				value={account.displayName}
				aria-invalid={!!updateErrors.displayName}
			/>
			{#if updateErrors.displayName}<p class="field-error">{updateErrors.displayName}</p>{/if}
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
				value={account.username}
				aria-invalid={!!updateErrors.username}
			/>
			{#if updateErrors.username}<p class="field-error">{updateErrors.username}</p>{/if}
		</div>
		<div class="field">
			<label for="email">Email <span class="muted">(optional)</span></label>
			<input
				id="email"
				name="email"
				type="email"
				value={account.email ?? ''}
				aria-invalid={!!updateErrors.email}
			/>
			{#if updateErrors.email}<p class="field-error">{updateErrors.email}</p>{/if}
		</div>
		<div class="field">
			<label for="role">Role</label>
			<select id="role" name="role" value={account.role}>
				<option value="member">Member</option>
				<option value="admin">Admin</option>
			</select>
		</div>
		<div class="field">
			<label for="status">Status</label>
			<select id="status" name="status" value={account.status}>
				<option value="active">Active</option>
				<option value="disabled">Disabled (can't sign in)</option>
			</select>
		</div>
	</div>
	<button type="submit" class="btn btn-primary"
		><i class="fas fa-floppy-disk"></i> Save profile</button
	>
</form>

<form method="POST" action="?/password" class="card" use:enhance>
	<h2>Set a new password</h2>
	{@render messages('password')}
	<p class="hint">Everyone signed in to this account (other than you) will be signed out.</p>
	<div class="form-grid">
		<div class="field">
			<label for="password">New password</label>
			<input
				id="password"
				name="password"
				type="password"
				required
				autocomplete="new-password"
				aria-invalid={!!passwordErrors.password}
			/>
			{#if passwordErrors.password}<p class="field-error">{passwordErrors.password}</p>{/if}
		</div>
		<div class="field">
			<label for="confirm">Confirm new password</label>
			<input
				id="confirm"
				name="confirm"
				type="password"
				required
				autocomplete="new-password"
				aria-invalid={!!passwordErrors.confirm}
			/>
			{#if passwordErrors.confirm}<p class="field-error">{passwordErrors.confirm}</p>{/if}
		</div>
	</div>
	<button type="submit" class="btn btn-primary"><i class="fas fa-key"></i> Set password</button>
</form>

<form method="POST" action="?/signOut" class="card" use:enhance>
	<h2>Sessions</h2>
	{@render messages('signOut')}
	<p class="hint">
		Signs this account out on every device{#if isMe}
			except this one{/if}.
	</p>
	<button type="submit" class="btn"
		><i class="fas fa-right-from-bracket"></i> Sign out everywhere</button
	>
</form>

{#if !isMe}
	<form method="POST" action="?/delete" class="card card-danger" use:enhance>
		<h2>Delete account</h2>
		{@render messages('delete')}
		<p class="hint">This can't be undone. Disabling the account keeps its history instead.</p>
		<div class="actions">
			<ConfirmButton
				label="Delete {account.username}"
				question="Delete this account for good?"
				confirmLabel="Delete"
			/>
		</div>
	</form>
{/if}
