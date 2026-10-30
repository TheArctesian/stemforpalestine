<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
</script>

<svelte:head>
	<title>Unsubscribe | STEM for Palestine</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="page">
	<div class="card">
		{#if form?.done}
			<h1>You're unsubscribed</h1>
			<p><strong>{data.email}</strong> won't get any more emails from us. Sorry to see you go.</p>
			<p>Changed your mind? Write to <a href="mailto:info@stem4pal.org">info@stem4pal.org</a>.</p>
		{:else if data.email && !form?.invalid}
			<h1>Unsubscribe?</h1>
			<p>Stop all STEM4Palestine emails to <strong>{data.email}</strong>.</p>
			<form method="POST" use:enhance>
				<button type="submit">Unsubscribe</button>
			</form>
		{:else}
			<h1>That link doesn't work</h1>
			<p>
				It may have been cut short. Use the link in the email again, or write to <a
					href="mailto:info@stem4pal.org">info@stem4pal.org</a
				> and we'll take you off the list.
			</p>
		{/if}
	</div>
</div>

<style>
	.page {
		background: #f4f9f0;
		padding: 4rem 1rem;
		margin-bottom: -4rem;
	}

	.card {
		max-width: 520px;
		margin: 0 auto;
		background: #ffffff;
		border: 1px solid var(--color-border-light);
		border-radius: 14px;
		padding: 2.25rem;
		text-align: center;
	}

	h1 {
		font-size: 1.6rem;
	}

	a {
		color: var(--color-primary-dark);
		text-decoration: underline;
	}

	button {
		padding: 0.8rem 1.75rem;
		border: none;
		border-radius: 8px;
		background: var(--color-primary);
		color: #ffffff;
		font: inherit;
		font-weight: 700;
		cursor: pointer;
	}
</style>
