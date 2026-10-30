<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';

	let { data, form } = $props();
	const deleted = $derived(page.url.searchParams.get('deleted'));
	const dateTime = new Intl.DateTimeFormat('en-US', {
		dateStyle: 'medium',
		timeStyle: 'short',
		timeZone: 'America/Los_Angeles'
	});
</script>

<svelte:head>
	<title>Events | STEM4Palestine Admin</title>
</svelte:head>

<header class="page-header">
	<div>
		<h1>Events</h1>
		<p>Event pages at stem4pal.org/events. Duplicate one to start the next in a series.</p>
	</div>
	<form method="POST" action="?/create" use:enhance>
		<button type="submit" class="btn btn-primary"><i class="fas fa-plus"></i> New event</button>
	</form>
</header>

{#if deleted}<p class="flash flash-success" role="status">
		Deleted <strong>{deleted}</strong>.
	</p>{/if}
{#if form?.message}<p class="flash flash-error" role="alert">{form.message}</p>{/if}

<div class="card">
	{#if data.events.length}
		<div class="table-wrap">
			<table class="list">
				<thead
					><tr
						><th>Event</th><th>When (Bay Area)</th><th>Where</th><th>Status</th><th
							><span class="visually-hidden">Actions</span></th
						></tr
					></thead
				>
				<tbody>
					{#each data.events as e (e.id)}
						<tr>
							<td
								><a href="/admin/events/{e.id}"
									><strong>{[e.title, e.subtitle].filter(Boolean).join(' ')}</strong></a
								></td
							>
							<td>{dateTime.format(new Date(e.startAt))}</td>
							<td>{e.venueName || '—'}</td>
							<td
								><span class="badge {e.status === 'published' ? 'badge-green' : 'badge-amber'}"
									>{e.status}</span
								></td
							>
							<td>
								<div class="actions">
									<a href="/admin/events/{e.id}" class="btn btn-small"
										><i class="fas fa-pen"></i> Edit</a
									>
									<a
										href="/events/{e.slug}"
										target="_blank"
										rel="noopener noreferrer"
										class="btn btn-small"><i class="fas fa-eye"></i> View</a
									>
									<form method="POST" action="?/duplicate" use:enhance>
										<input type="hidden" name="id" value={e.id} />
										<button type="submit" class="btn btn-small"
											><i class="fas fa-clone"></i> Duplicate</button
										>
									</form>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<div class="empty-state">
			<i class="fas fa-calendar-plus"></i>
			<p>No events yet.</p>
		</div>
	{/if}
</div>
