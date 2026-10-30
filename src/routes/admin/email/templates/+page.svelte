<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';

	let { data } = $props();
	const deleted = $derived(page.url.searchParams.get('deleted'));
	const dateTime = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' });
</script>

<svelte:head>
	<title>Email templates | STEM4Palestine Admin</title>
</svelte:head>

<header class="page-header">
	<div>
		<h1>Email templates</h1>
		<p>
			Reusable emails. Link a template to forms to use their answers as {'{{placeholders}}'} and send
			it to their submitters.
		</p>
	</div>
	<form method="POST" action="?/create" use:enhance>
		<button type="submit" class="btn btn-primary"><i class="fas fa-plus"></i> New template</button>
	</form>
</header>

{#if deleted}<p class="flash flash-success" role="status">
		Deleted <strong>{deleted}</strong>.
	</p>{/if}

<div class="card">
	{#if data.templates.length}
		<div class="table-wrap">
			<table class="list">
				<thead
					><tr
						><th>Template</th><th>Subject</th><th>Linked forms</th><th>Edited</th><th
							><span class="visually-hidden">Actions</span></th
						></tr
					></thead
				>
				<tbody>
					{#each data.templates as t (t.id)}
						<tr>
							<td><a href="/admin/email/templates/{t.id}"><strong>{t.name}</strong></a></td>
							<td>{t.subject}</td>
							<td
								>{#each t.forms as title (title)}<span class="badge">{title}</span>
								{:else}<span class="muted">None</span>{/each}</td
							>
							<td class="muted">{dateTime.format(t.updatedAt)}</td>
							<td>
								<div class="actions">
									<a href="/admin/email/templates/{t.id}" class="btn btn-small"
										><i class="fas fa-pen"></i> Edit</a
									>
									<a
										href="/admin/email/campaigns/new?template={t.id}"
										class="btn btn-small btn-primary"><i class="fas fa-paper-plane"></i> Send</a
									>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<div class="empty-state">
			<i class="fas fa-envelope-open-text"></i>
			<p>No templates yet.</p>
		</div>
	{/if}
</div>
