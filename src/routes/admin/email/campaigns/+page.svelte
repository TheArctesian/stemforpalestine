<script lang="ts">
	import { page } from '$app/state';

	let { data } = $props();
	const deleted = $derived(page.url.searchParams.get('deleted'));
	const dateTime = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' });
	const badge = {
		draft: 'badge-amber',
		sending: 'badge-blue',
		sent: 'badge-green',
		cancelled: ''
	} as const;
</script>

<svelte:head>
	<title>Campaigns | STEM4Palestine Admin</title>
</svelte:head>

<header class="page-header">
	<div>
		<h1>Campaigns</h1>
		<p>Emails sent from a template to people who filled in your forms.</p>
	</div>
	<a href="/admin/email/campaigns/new" class="btn btn-primary"
		><i class="fas fa-paper-plane"></i> New campaign</a
	>
</header>

{#if deleted}<p class="flash flash-success" role="status">
		Deleted <strong>{deleted}</strong>.
	</p>{/if}

<div class="card">
	{#if data.campaigns.length}
		<div class="table-wrap">
			<table class="list">
				<thead
					><tr
						><th>Campaign</th><th>Status</th><th>Recipients</th><th>Sent</th><th>Failed</th><th
							>Started</th
						></tr
					></thead
				>
				<tbody>
					{#each data.campaigns as c (c.id)}
						<tr>
							<td
								><a href="/admin/email/campaigns/{c.id}"><strong>{c.name}</strong></a>
								<div class="muted">{c.subject}</div></td
							>
							<td><span class="badge {badge[c.status]}">{c.status}</span></td>
							<td>{c.status === 'draft' ? '—' : c.recipientCount}</td>
							<td>{c.sentCount}</td>
							<td>{c.failedCount || '—'}</td>
							<td class="muted">{c.startedAt ? dateTime.format(c.startedAt) : 'Not yet'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<div class="empty-state">
			<i class="fas fa-paper-plane"></i>
			<p>No campaigns yet. Write a template first, then send it from here.</p>
		</div>
	{/if}
</div>
