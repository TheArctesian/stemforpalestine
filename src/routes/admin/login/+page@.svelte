<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
	let submitting = $state(false);
</script>

<svelte:head>
	<title>Sign in | STEM4Palestine Admin</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="login-page">
	<form
		method="POST"
		class="login-card"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
	>
		<a href="/" class="brand">STEM4Palestine</a>
		<h1>Admin sign in</h1>

		{#if form?.message}
			<p class="error" role="alert">{form.message}</p>
		{/if}

		<label for="username">Username</label>
		<input
			id="username"
			name="username"
			type="text"
			autocomplete="username"
			autocapitalize="none"
			spellcheck="false"
			required
			value={form?.username ?? ''}
		/>

		<label for="password">Password</label>
		<input id="password" name="password" type="password" autocomplete="current-password" required />

		<button type="submit" disabled={submitting}>
			{#if submitting}Signing in…{:else}Sign in{/if}
		</button>
	</form>
</div>

<style>
	.login-page {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: 1.5rem;
		background:
			radial-gradient(ellipse at 50% 120%, rgba(0, 150, 57, 0.28) 0%, transparent 60%),
			linear-gradient(160deg, #0b1029 0%, #1b2350 55%, #0b1029 100%);
	}

	.login-card {
		width: 100%;
		max-width: 380px;
		display: flex;
		flex-direction: column;
		background: #ffffff;
		border-radius: 14px;
		padding: 2rem;
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
	}

	.brand {
		font-weight: 800;
		font-size: 1.1rem;
		color: var(--color-primary);
		margin-bottom: 0.25rem;
	}

	h1 {
		font-size: 1.5rem;
		margin-bottom: 1.25rem;
	}

	label {
		font-weight: 600;
		font-size: 0.9rem;
		margin-bottom: 0.35rem;
	}

	input {
		padding: 0.65rem 0.75rem;
		border: 1px solid var(--color-border-medium);
		border-radius: 8px;
		font: inherit;
		margin-bottom: 1rem;
	}

	input:focus-visible {
		outline: 2px solid color-mix(in srgb, var(--color-primary) 35%, transparent);
		border-color: var(--color-primary);
	}

	button {
		margin-top: 0.5rem;
		padding: 0.75rem;
		border: none;
		border-radius: 8px;
		background: var(--color-primary);
		color: #ffffff;
		font: inherit;
		font-weight: 700;
		cursor: pointer;
	}

	button:hover {
		background: var(--color-primary-dark);
	}

	button:disabled {
		opacity: 0.7;
		cursor: progress;
	}

	.error {
		background: #fef2f2;
		color: #991b1b;
		border: 1px solid #fecaca;
		border-radius: 8px;
		padding: 0.65rem 0.8rem;
		font-size: 0.9rem;
	}
</style>
