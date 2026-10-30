<script lang="ts">
	import { enhance } from '$app/forms';
	import ConfirmButton from '$lib/admin/ConfirmButton.svelte';

	let { data, form } = $props();
	let search = $state('');
	const shown = $derived(
		data.suppressions.filter((s) => !search || s.email.includes(search.toLowerCase()))
	);
	const reasons = {
		unsubscribed: 'Unsubscribed',
		bounced: 'Bounced',
		complained: 'Marked as spam',
		manual: 'Added by hand'
	} as const;
</script>

<svelte:head>
	<title>Unsubscribes | STEM4Palestine Admin</title>
</svelte:head>

<header class="page-header">
	<div>
		<h1>Unsubscribes</h1>
		<p>No campaign is ever sent to these addresses, whatever forms they fill in.</p>
	</div>
</header>

{#if form?.added}<p class="flash flash-success" role="status">Added {form.added}.</p>{/if}
{#if form?.removed}<p class="flash flash-success" role="status">
		{form.removed} can get emails again.
	</p>{/if}
{#if form?.message}<p class="flash flash-error" role="alert">{form.message}</p>{/if}

<form method="POST" action="?/add" class="card" use:enhance>
	<h2>Add an address</h2>
	<div class="form-grid">
		<div class="field">
			<label for="s-email">Email</label><input id="s-email" name="email" type="email" required />
		</div>
		<div class="field">
			<label for="s-note">Note <span class="muted">(optional)</span></label><input
				id="s-note"
				name="note"
				type="text"
				placeholder="e.g. asked in person"
			/>
		</div>
	</div>
	<button type="submit" class="btn btn-primary"
		><i class="fas fa-ban"></i> Stop emailing them</button
	>
</form>

<div class="card">
	<input
		type="search"
		placeholder="Search"
		bind:value={search}
		aria-label="Search unsubscribes"
		class="search"
	/>
	<div class="table-wrap">
		<table class="list">
			<thead
				><tr
					><th>Email</th><th>Why</th><th>Since</th><th
						><span class="visually-hidden">Actions</span></th
					></tr
				></thead
			>
			<tbody>
				{#each shown as s (s.email)}
					<tr>
						<td
							>{s.email}{#if s.note}<div class="muted">{s.note}</div>{/if}</td
						>
						<td
							><span class="badge {s.reason === 'manual' ? '' : 'badge-red'}"
								>{reasons[s.reason]}</span
							></td
						>
						<td class="muted">{s.createdAt}</td>
						<td>
							<form method="POST" action="?/remove" use:enhance>
								<input type="hidden" name="email" value={s.email} />
								<ConfirmButton
									label="Remove"
									icon="fa-rotate-left"
									question={s.reason === 'manual'
										? 'Email them again?'
										: 'They asked not to be emailed. Remove anyway?'}
									confirmLabel="Remove"
								/>
							</form>
						</td>
					</tr>
				{:else}
					<tr><td colspan="4" class="muted">Nobody yet.</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<style>
	.search {
		max-width: 320px;
		margin-bottom: 0.75rem;
	}
</style>
