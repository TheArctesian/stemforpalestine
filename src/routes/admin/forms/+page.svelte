<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';

	let { data, form } = $props();

	const deleted = $derived(page.url.searchParams.get('deleted'));
	const dateTime = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' });
	const statusBadge = { draft: 'badge-amber', open: 'badge-green', closed: '' } as const;

	let copied = $state<string | null>(null);
	async function copyLink(slug: string) {
		await navigator.clipboard.writeText(`${page.url.origin}/forms/${slug}`);
		copied = slug;
		setTimeout(() => (copied = null), 2000);
	}
</script>

<svelte:head>
	<title>Forms | STEM4Palestine Admin</title>
</svelte:head>

<header class="page-header">
	<div>
		<h1>Forms</h1>
		<p>Sign-up and interest forms on stem4pal.org, and what people have sent.</p>
	</div>
	<a href="/admin/forms/new" class="btn btn-primary"><i class="fas fa-plus"></i> New form</a>
</header>

{#if deleted}
	<p class="flash flash-success" role="status">
		Deleted <strong>{deleted}</strong> and its submissions.
	</p>
{/if}
{#if form?.message}<p class="flash flash-error" role="alert">{form.message}</p>{/if}

<div class="card">
	{#if data.forms.length}
		<div class="table-wrap">
			<table class="list">
				<thead>
					<tr>
						<th>Form</th>
						<th>Status</th>
						<th>Submissions</th>
						<th>Last submission</th>
						<th><span class="visually-hidden">Actions</span></th>
					</tr>
				</thead>
				<tbody>
					{#each data.forms as f (f.id)}
						<tr>
							<td>
								<a href="/admin/forms/{f.id}/edit" class="form-title">{f.title}</a>
								<div class="link-row">
									<a href="/forms/{f.slug}" target="_blank" rel="noopener noreferrer" class="muted"
										>/forms/{f.slug}</a
									>
									<button
										type="button"
										class="copy"
										onclick={() => copyLink(f.slug)}
										aria-label="Copy link to {f.title}"
									>
										<i class="fas {copied === f.slug ? 'fa-check' : 'fa-copy'}"></i>
									</button>
								</div>
							</td>
							<td><span class="badge {statusBadge[f.status]}">{f.status}</span></td>
							<td>{f.submissions}</td>
							<td class="muted">{f.lastSubmission ? dateTime.format(f.lastSubmission) : '—'}</td>
							<td>
								<div class="actions">
									<a href="/admin/forms/{f.id}/submissions" class="btn btn-small btn-primary">
										<i class="fas fa-table"></i> Submissions
									</a>
									<a href="/admin/forms/{f.id}/edit" class="btn btn-small"
										><i class="fas fa-pen"></i> Edit</a
									>
									<form method="POST" action="?/duplicate" use:enhance>
										<input type="hidden" name="id" value={f.id} />
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
			<i class="fas fa-clipboard-list"></i>
			<p>No forms yet. Start with the interest form template.</p>
			<a href="/admin/forms/new" class="btn btn-primary"><i class="fas fa-plus"></i> New form</a>
		</div>
	{/if}
</div>

<style>
	.form-title {
		font-weight: 700;
		color: var(--color-text-primary);
	}

	.form-title:hover {
		color: var(--color-primary-dark);
	}

	.link-row {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.85rem;
	}

	.copy {
		background: none;
		border: none;
		color: var(--color-text-light);
		cursor: pointer;
		padding: 0.1rem 0.25rem;
	}

	.copy:hover {
		color: var(--color-primary-dark);
	}
</style>
