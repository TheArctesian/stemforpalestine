<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	const errors = $derived<Record<string, string | undefined>>(form?.errors ?? {});
</script>

<svelte:head>
	<title>Account | STEM4Palestine Admin</title>
</svelte:head>

<header class="page-header">
	<div>
		<h1>Account</h1>
		<p>Signed in as <strong>{data.user.displayName}</strong> (@{data.user.username}).</p>
	</div>
</header>

<form method="POST" class="card" use:enhance>
	<h2>Change password</h2>
	{#if form?.success}
		<p class="flash flash-success" role="status">Password changed.</p>
	{/if}
	<p class="flash flash-info">
		If several people share this account, changing the password changes it for all of them. Tell
		them the new one.
	</p>

	<div class="form-grid">
		<div class="field">
			<label for="current">Current password</label>
			<input
				id="current"
				name="current"
				type="password"
				required
				autocomplete="current-password"
				aria-invalid={!!errors.current}
			/>
			{#if errors.current}<p class="field-error">{errors.current}</p>{/if}
		</div>
		<div class="field">
			<label for="password">New password</label>
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
		<div class="field">
			<label for="confirm">Confirm new password</label>
			<input
				id="confirm"
				name="confirm"
				type="password"
				required
				autocomplete="new-password"
				aria-invalid={!!errors.confirm}
			/>
			{#if errors.confirm}<p class="field-error">{errors.confirm}</p>{/if}
		</div>
	</div>

	<label class="check">
		<input type="checkbox" name="signOutOthers" checked />
		Sign everyone else out of this account
	</label>

	<button type="submit" class="btn btn-primary"><i class="fas fa-key"></i> Change password</button>
</form>
